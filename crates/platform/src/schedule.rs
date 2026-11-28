//! 計画の日付履歴と同期の鮮度。
//!
//! 当初（baseline）・承認済み改訂（revision）・予測（forecast）・実績（actual）を
//! 追記専用の履歴として持ち、上書きしない。任意の時点の計画差異を再現できる。

use chrono::{DateTime, Duration, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DateKind {
    Baseline,
    Revision,
    Forecast,
    Actual,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct DateEntry {
    pub kind: DateKind,
    pub date: NaiveDate,
    pub recorded_at: DateTime<Utc>,
    /// 改訂・予測の理由（改訂では必須）
    pub reason: Option<String>,
    /// 承認者（改訂では必須）
    pub approved_by: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ScheduleError {
    /// 当初の日付は最初の1件だけ
    BaselineAlreadySet,
    MissingBaseline,
    /// 履歴は記録時刻の順に追記する
    OutOfOrder,
    /// 承認済み改訂には理由と承認者が必要
    UnapprovedRevision,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct MilestoneHistory {
    entries: Vec<DateEntry>,
}

/// ある時点から見たマイルストーンの日付
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MilestoneView {
    pub baseline: NaiveDate,
    pub revised: Option<NaiveDate>,
    pub forecast: Option<NaiveDate>,
    pub actual: Option<NaiveDate>,
    /// 実績、なければ最新の見込み（予測または改訂のうち新しく記録されたもの）
    pub current: NaiveDate,
    /// 承認済みの計画（改訂、なければ当初）からのずれ（日）。正は遅れ
    pub slip_from_plan: i64,
    /// 当初からのずれ（日）
    pub slip_from_baseline: i64,
}

impl MilestoneHistory {
    pub fn new(baseline: NaiveDate, recorded_at: DateTime<Utc>) -> Self {
        Self {
            entries: vec![DateEntry {
                kind: DateKind::Baseline,
                date: baseline,
                recorded_at,
                reason: None,
                approved_by: None,
            }],
        }
    }

    pub fn entries(&self) -> &[DateEntry] {
        &self.entries
    }

    /// 履歴に追記する。既存の記録は変更しない。
    pub fn record(&mut self, entry: DateEntry) -> Result<(), ScheduleError> {
        let Some(last) = self.entries.last() else {
            return Err(ScheduleError::MissingBaseline);
        };
        if entry.kind == DateKind::Baseline {
            return Err(ScheduleError::BaselineAlreadySet);
        }
        if entry.recorded_at < last.recorded_at {
            return Err(ScheduleError::OutOfOrder);
        }
        if entry.kind == DateKind::Revision {
            let filled = |v: &Option<String>| v.as_deref().is_some_and(|s| !s.trim().is_empty());
            if !filled(&entry.reason) || !filled(&entry.approved_by) {
                return Err(ScheduleError::UnapprovedRevision);
            }
        }
        self.entries.push(entry);
        Ok(())
    }

    /// `as_of` の時点で記録されていた情報だけを使って日付を求める。
    pub fn view_at(&self, as_of: DateTime<Utc>) -> Option<MilestoneView> {
        let known: Vec<&DateEntry> = self
            .entries
            .iter()
            .filter(|e| e.recorded_at <= as_of)
            .collect();
        let latest = |kind: DateKind| known.iter().rev().find(|e| e.kind == kind).copied();
        let baseline = latest(DateKind::Baseline)?.date;
        let revision = latest(DateKind::Revision);
        let forecast = latest(DateKind::Forecast);
        let actual = latest(DateKind::Actual);

        // 予測より後に承認済み改訂があれば、その改訂が最新の見込み
        let outlook = match (revision, forecast) {
            (Some(r), Some(f)) if r.recorded_at > f.recorded_at => Some(r.date),
            (_, Some(f)) => Some(f.date),
            (Some(r), None) => Some(r.date),
            (None, None) => None,
        };
        let current = actual.map(|e| e.date).or(outlook).unwrap_or(baseline);
        let plan = revision.map(|e| e.date).unwrap_or(baseline);
        Some(MilestoneView {
            baseline,
            revised: revision.map(|e| e.date),
            forecast: forecast.map(|e| e.date),
            actual: actual.map(|e| e.date),
            current,
            slip_from_plan: (current - plan).num_days(),
            slip_from_baseline: (current - baseline).num_days(),
        })
    }
}

/// 同期の鮮度。古い情報を最新と誤認させないために、表示の前に必ず判定する。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Freshness {
    Fresh,
    Stale,
    NeverSynced,
}

/// SSOT で確定した鮮度のしきい値（60分）
pub const STALE_AFTER_MINUTES: i64 = 60;

pub fn freshness(last_success_at: Option<DateTime<Utc>>, now: DateTime<Utc>) -> Freshness {
    match last_success_at {
        None => Freshness::NeverSynced,
        Some(at) if now - at > Duration::minutes(STALE_AFTER_MINUTES) => Freshness::Stale,
        Some(_) => Freshness::Fresh,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn day(m: u32, d: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, m, d).unwrap()
    }

    fn at(m: u32, d: u32) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, m, d, 0, 0, 0).unwrap()
    }

    fn entry(kind: DateKind, date: NaiveDate, recorded_at: DateTime<Utc>) -> DateEntry {
        DateEntry {
            kind,
            date,
            recorded_at,
            reason: None,
            approved_by: None,
        }
    }

    #[test]
    fn keeps_the_baseline_and_reproduces_past_variance() {
        let mut ms = MilestoneHistory::new(day(12, 10), at(8, 1));
        ms.record(entry(DateKind::Forecast, day(12, 17), at(11, 20)))
            .unwrap();

        let before = ms.view_at(at(11, 1)).unwrap();
        assert_eq!(before.current, day(12, 10));
        assert_eq!(before.slip_from_plan, 0);

        let now = ms.view_at(at(11, 27)).unwrap();
        assert_eq!(now.baseline, day(12, 10));
        assert_eq!(now.current, day(12, 17));
        assert_eq!(now.slip_from_plan, 7);
        assert!(ms.view_at(at(7, 1)).is_none());
    }

    #[test]
    fn approved_revision_moves_the_plan_but_not_the_baseline() {
        let mut ms = MilestoneHistory::new(day(9, 30), at(6, 1));
        let mut revision = entry(DateKind::Revision, day(10, 9), at(9, 10));
        assert_eq!(
            ms.record(revision.clone()),
            Err(ScheduleError::UnapprovedRevision)
        );
        revision.reason = Some("CR-0002 による要求追加".to_owned());
        revision.approved_by = Some("u-nakamura".to_owned());
        ms.record(revision).unwrap();
        ms.record(entry(DateKind::Actual, day(10, 8), at(10, 8)))
            .unwrap();

        let view = ms.view_at(at(10, 9)).unwrap();
        assert_eq!(view.revised, Some(day(10, 9)));
        assert_eq!(view.current, day(10, 8));
        assert_eq!(view.slip_from_plan, -1);
        assert_eq!(view.slip_from_baseline, 8);
    }

    #[test]
    fn rejects_rewrites_of_history() {
        let mut ms = MilestoneHistory::new(day(12, 10), at(8, 1));
        assert_eq!(
            ms.record(entry(DateKind::Baseline, day(12, 20), at(9, 1))),
            Err(ScheduleError::BaselineAlreadySet)
        );
        ms.record(entry(DateKind::Forecast, day(12, 17), at(11, 20)))
            .unwrap();
        assert_eq!(
            ms.record(entry(DateKind::Forecast, day(12, 12), at(11, 1))),
            Err(ScheduleError::OutOfOrder)
        );
        assert_eq!(ms.entries().len(), 2);
    }

    #[test]
    fn marks_old_sync_results_as_stale() {
        let now = Utc.with_ymd_and_hms(2026, 11, 27, 10, 30, 0).unwrap();
        assert_eq!(freshness(None, now), Freshness::NeverSynced);
        assert_eq!(
            freshness(Some(now - Duration::minutes(15)), now),
            Freshness::Fresh
        );
        assert_eq!(
            freshness(Some(now - Duration::minutes(95)), now),
            Freshness::Stale
        );
    }
}
