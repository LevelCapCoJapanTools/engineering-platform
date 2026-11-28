//! GitHub Webhook の署名検証と、イベントが指すリソースの特定。
//!
//! 署名を検証できない配信は保存しない（SSOT「確定した設計判断」）。秘密値はログに出さない。

use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use serde_json::Value;
use sha2::{Digest, Sha256};

#[derive(Debug, PartialEq, Eq)]
pub enum SignatureError {
    Missing,
    Malformed,
    Mismatch,
}

fn decode_hex(text: &str) -> Option<Vec<u8>> {
    if !text.len().is_multiple_of(2) {
        return None;
    }
    (0..text.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(text.get(i..i + 2)?, 16).ok())
        .collect()
}

/// `X-Hub-Signature-256: sha256=<hex>` を検証する。比較は定数時間で行う。
pub fn verify_github_signature(
    secret: &[u8],
    body: &[u8],
    header: Option<&str>,
) -> Result<(), SignatureError> {
    let header = header.ok_or(SignatureError::Missing)?;
    let hex = header
        .strip_prefix("sha256=")
        .ok_or(SignatureError::Malformed)?;
    let expected = decode_hex(hex).ok_or(SignatureError::Malformed)?;
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC accepts keys of any length");
    mac.update(body);
    mac.verify_slice(&expected)
        .map_err(|_| SignatureError::Mismatch)
}

pub fn sha256_hex(body: &[u8]) -> String {
    Sha256::digest(body)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// イベントが更新するリソースと、その版（提供元の更新時刻）
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResourceRef {
    pub key: String,
    pub version: DateTime<Utc>,
}

fn timestamp(value: &Value, pointer: &str) -> Option<DateTime<Utc>> {
    value
        .pointer(pointer)?
        .as_str()?
        .parse::<DateTime<Utc>>()
        .ok()
}

/// 追跡するイベントだけリソースを返す。それ以外は記録のみ（untracked）とする。
pub fn github_resource(event_kind: &str, payload: &Value) -> Option<ResourceRef> {
    let repo = payload
        .pointer("/repository/full_name")
        .and_then(Value::as_str);
    let (key, version) = match event_kind {
        "pull_request" => (
            format!(
                "{}#pr/{}",
                repo?,
                payload.pointer("/pull_request/number")?.as_u64()?
            ),
            timestamp(payload, "/pull_request/updated_at")?,
        ),
        "issues" => (
            format!(
                "{}#issue/{}",
                repo?,
                payload.pointer("/issue/number")?.as_u64()?
            ),
            timestamp(payload, "/issue/updated_at")?,
        ),
        "check_run" => (
            format!(
                "{}#check_run/{}",
                repo?,
                payload.pointer("/check_run/id")?.as_u64()?
            ),
            timestamp(payload, "/check_run/completed_at")
                .or_else(|| timestamp(payload, "/check_run/started_at"))?,
        ),
        "projects_v2_item" => (
            format!(
                "projects_v2_item/{}",
                payload.pointer("/projects_v2_item/node_id")?.as_str()?
            ),
            timestamp(payload, "/projects_v2_item/updated_at")?,
        ),
        _ => return None,
    };
    Some(ResourceRef { key, version })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sign(secret: &[u8], body: &[u8]) -> String {
        let mut mac = Hmac::<Sha256>::new_from_slice(secret).unwrap();
        mac.update(body);
        let bytes = mac.finalize().into_bytes();
        format!(
            "sha256={}",
            bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
        )
    }

    #[test]
    fn verifies_github_signatures() {
        let body = br#"{"action":"opened"}"#;
        let header = sign(b"secret", body);
        assert_eq!(
            verify_github_signature(b"secret", body, Some(&header)),
            Ok(())
        );
        assert_eq!(
            verify_github_signature(b"other", body, Some(&header)),
            Err(SignatureError::Mismatch)
        );
        assert_eq!(
            verify_github_signature(b"secret", b"{}", Some(&header)),
            Err(SignatureError::Mismatch)
        );
        assert_eq!(
            verify_github_signature(b"secret", body, None),
            Err(SignatureError::Missing)
        );
        assert_eq!(
            verify_github_signature(b"secret", body, Some("sha1=abcd")),
            Err(SignatureError::Malformed)
        );
        assert_eq!(
            verify_github_signature(b"secret", body, Some("sha256=zz")),
            Err(SignatureError::Malformed)
        );
    }

    #[test]
    fn identifies_tracked_resources() {
        let payload: Value = serde_json::from_str(
            r#"{"repository":{"full_name":"example/order-api"},
                "pull_request":{"number":142,"updated_at":"2026-11-27T00:38:00Z"}}"#,
        )
        .unwrap();
        let resource = github_resource("pull_request", &payload).unwrap();
        assert_eq!(resource.key, "example/order-api#pr/142");
        assert_eq!(resource.version.to_rfc3339(), "2026-11-27T00:38:00+00:00");
        assert!(github_resource("star", &payload).is_none());
        assert!(github_resource("issues", &payload).is_none());
    }

    #[test]
    fn hashes_payloads() {
        assert_eq!(
            sha256_hex(b""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }
}
