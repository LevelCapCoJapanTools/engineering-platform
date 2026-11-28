//! 顧客への公開範囲のフィルタ（SSOT「取引・公開・引き渡しの範囲」）。
//!
//! 案件の内部ビューから、閲覧者の種類と公開設定に応じた公開ビューを作る。
//! 公開ビューは内部の値を持たない別の型にして、直列化しても内部予算・委託費・粗利が出ないようにする。
//! 公開ビューには内部の値を含む合計を入れないので、差し引きで逆算することもできない。

use serde::{Deserialize, Serialize};

/// 共同費目の負担割合（ベーシスポイント。5000 = 50%）
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct Share {
    pub company: String,
    pub basis_points: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct JointItem {
    pub name: String,
    pub budget: i64,
    pub actual: i64,
    pub shares: Vec<Share>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct ProgressItem {
    pub deliverable: String,
    pub status: String,
    /// JV責任者が公開を確定した項目だけ顧客に見せる
    pub published: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct FreelancerFee {
    pub freelancer_id: String,
    pub order_title: String,
    pub fee: i64,
}

/// 案件の内部ビュー（JV内部だけが見る）
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct InternalView {
    pub project: String,
    pub contract_amount: i64,
    pub internal_budget: i64,
    pub commission_total: i64,
    pub freelancer_fees: Vec<FreelancerFee>,
    pub joint_items: Vec<JointItem>,
    pub progress: Vec<ProgressItem>,
}

impl InternalView {
    /// 粗利（契約額 − 内部予算）。内部ビューでだけ計算する
    pub fn gross_margin(&self) -> i64 {
        self.contract_amount - self.internal_budget
    }
}

/// JV責任者が決める公開設定
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize, Serialize)]
pub struct DisclosureSettings {
    pub contract_amount: bool,
    /// 提携契約で合意した共同費目の名前（業務提携型だけに効く）
    pub joint_items: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Viewer {
    OutsourcingCustomer,
    AllianceCustomer,
    Freelancer { id: String },
    JvInternal,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PublicShare {
    pub company: String,
    pub amount: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PublicJointItem {
    pub name: String,
    pub budget: i64,
    pub actual: i64,
    pub shares: Vec<PublicShare>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PublicProgress {
    pub deliverable: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct OwnOrder {
    pub order_title: String,
    pub fee: i64,
}

/// 顧客・受託者に見せるビュー。内部の値を持つ項目を型として持たない。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PublicView {
    pub project: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contract_amount: Option<i64>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub progress: Vec<PublicProgress>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub joint_items: Vec<PublicJointItem>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub own_orders: Vec<OwnOrder>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(untagged)]
pub enum View {
    Internal(Box<InternalView>),
    Public(PublicView),
}

fn share_amount(total: i64, basis_points: u32) -> i64 {
    total * i64::from(basis_points) / 10_000
}

/// 閲覧者の種類と公開設定から、見せてよい値だけのビューを作る。
pub fn view_for(internal: &InternalView, viewer: &Viewer, settings: &DisclosureSettings) -> View {
    let customer = |alliance: bool| PublicView {
        project: internal.project.clone(),
        contract_amount: settings.contract_amount.then_some(internal.contract_amount),
        progress: internal
            .progress
            .iter()
            .filter(|p| p.published)
            .map(|p| PublicProgress {
                deliverable: p.deliverable.clone(),
                status: p.status.clone(),
            })
            .collect(),
        joint_items: if alliance {
            internal
                .joint_items
                .iter()
                .filter(|j| settings.joint_items.contains(&j.name))
                .map(|j| PublicJointItem {
                    name: j.name.clone(),
                    budget: j.budget,
                    actual: j.actual,
                    shares: j
                        .shares
                        .iter()
                        .map(|s| PublicShare {
                            company: s.company.clone(),
                            amount: share_amount(j.budget, s.basis_points),
                        })
                        .collect(),
                })
                .collect()
        } else {
            Vec::new()
        },
        own_orders: Vec::new(),
    };
    match viewer {
        Viewer::JvInternal => View::Internal(Box::new(internal.clone())),
        Viewer::OutsourcingCustomer => View::Public(customer(false)),
        Viewer::AllianceCustomer => View::Public(customer(true)),
        Viewer::Freelancer { id } => View::Public(PublicView {
            project: internal.project.clone(),
            contract_amount: None,
            progress: Vec::new(),
            joint_items: Vec::new(),
            own_orders: internal
                .freelancer_fees
                .iter()
                .filter(|f| &f.freelancer_id == id)
                .map(|f| OwnOrder {
                    order_title: f.order_title.clone(),
                    fee: f.fee,
                })
                .collect(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 資料 4.1 の例: 契約額1,000万円、JV内部予算700万円、委託費300万円、共同試験費80万円を折半
    fn example() -> InternalView {
        InternalView {
            project: "order-renewal".to_owned(),
            contract_amount: 10_000_000,
            internal_budget: 7_000_000,
            commission_total: 3_000_000,
            freelancer_fees: vec![
                FreelancerFee {
                    freelancer_id: "u-matsuda".to_owned(),
                    order_title: "受注一覧の CSV 出力".to_owned(),
                    fee: 450_000,
                },
                FreelancerFee {
                    freelancer_id: "u-hayashi".to_owned(),
                    order_title: "取引先マスタの CSV 一括取込".to_owned(),
                    fee: 1_150_000,
                },
            ],
            joint_items: vec![
                JointItem {
                    name: "共同試験費".to_owned(),
                    budget: 800_000,
                    actual: 520_000,
                    shares: vec![
                        Share {
                            company: "架空リテール株式会社".to_owned(),
                            basis_points: 5_000,
                        },
                        Share {
                            company: "サンプルソフト株式会社".to_owned(),
                            basis_points: 5_000,
                        },
                    ],
                },
                JointItem {
                    name: "社内開発費".to_owned(),
                    budget: 6_200_000,
                    actual: 3_100_000,
                    shares: vec![],
                },
            ],
            progress: vec![
                ProgressItem {
                    deliverable: "v1.3.0".to_owned(),
                    status: "受入済み".to_owned(),
                    published: true,
                },
                ProgressItem {
                    deliverable: "社内レビュー".to_owned(),
                    status: "未着手".to_owned(),
                    published: false,
                },
            ],
        }
    }

    fn settings() -> DisclosureSettings {
        DisclosureSettings {
            contract_amount: true,
            joint_items: vec!["共同試験費".to_owned()],
        }
    }

    /// 直列化した JSON に出てくる数値をすべて集める
    fn numbers(view: &View) -> Vec<i64> {
        fn walk(value: &serde_json::Value, out: &mut Vec<i64>) {
            match value {
                serde_json::Value::Number(n) => out.extend(n.as_i64()),
                serde_json::Value::Array(items) => items.iter().for_each(|v| walk(v, out)),
                serde_json::Value::Object(map) => map.values().for_each(|v| walk(v, out)),
                _ => {}
            }
        }
        let mut out = Vec::new();
        walk(&serde_json::to_value(view).unwrap(), &mut out);
        out
    }

    fn assert_no_internal_values(view: &View) {
        let internal = example();
        let json = serde_json::to_string(view).unwrap();
        for word in [
            "internal_budget",
            "commission",
            "margin",
            "freelancer_fees",
            "社内開発費",
            "社内レビュー",
        ] {
            assert!(!json.contains(word), "{word} leaked: {json}");
        }
        let found = numbers(view);
        let secret = [
            internal.internal_budget,
            internal.commission_total,
            internal.gross_margin(),
            450_000,
            1_150_000,
        ];
        for value in secret {
            assert!(!found.contains(&value), "{value} leaked: {json}");
        }
        // 公開された数値同士の和・差でも内部の値にならない（逆算できない）
        for a in &found {
            for b in &found {
                for derived in [a + b, a - b] {
                    assert!(!secret.contains(&derived), "{derived} derivable: {json}");
                }
            }
        }
    }

    #[test]
    fn outsourcing_customer_sees_only_contract_amount_and_published_progress() {
        let view = view_for(&example(), &Viewer::OutsourcingCustomer, &settings());
        let View::Public(public) = &view else {
            panic!("customer must get a public view");
        };
        assert_eq!(public.contract_amount, Some(10_000_000));
        assert_eq!(public.progress.len(), 1);
        assert!(public.joint_items.is_empty());
        assert_no_internal_values(&view);
    }

    #[test]
    fn alliance_customer_also_sees_agreed_joint_items_and_shares() {
        let view = view_for(&example(), &Viewer::AllianceCustomer, &settings());
        let View::Public(public) = &view else {
            panic!("customer must get a public view");
        };
        assert_eq!(public.joint_items.len(), 1);
        let item = &public.joint_items[0];
        assert_eq!((item.name.as_str(), item.budget), ("共同試験費", 800_000));
        assert!(item.shares.iter().all(|s| s.amount == 400_000));
        assert_no_internal_values(&view);
    }

    #[test]
    fn freelancer_sees_only_own_fee() {
        let view = view_for(
            &example(),
            &Viewer::Freelancer {
                id: "u-matsuda".to_owned(),
            },
            &settings(),
        );
        let json = serde_json::to_string(&view).unwrap();
        assert!(json.contains("450000"));
        assert!(!json.contains("1150000"));
        assert!(!json.contains("10000000"));
    }

    #[test]
    fn nothing_is_disclosed_by_default() {
        let view = view_for(
            &example(),
            &Viewer::AllianceCustomer,
            &DisclosureSettings::default(),
        );
        assert_eq!(numbers(&view), Vec::<i64>::new());
    }

    #[test]
    fn internal_viewer_keeps_every_value() {
        let View::Internal(view) = view_for(&example(), &Viewer::JvInternal, &settings()) else {
            panic!("JV must get the internal view");
        };
        assert_eq!(view.gross_margin(), 3_000_000);
    }
}
