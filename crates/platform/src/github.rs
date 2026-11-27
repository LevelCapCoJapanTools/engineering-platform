use serde::{Deserialize, Serialize};

/// Fields shared with the GitHub Checks response. Demo fixtures are the only source for v1.
#[derive(Debug, Deserialize, Serialize)]
pub struct CheckRun {
    pub name: String,
    pub head_sha: String,
    pub status: String,
    pub conclusion: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CheckSnapshot {
    pub repository: String,
    pub head_sha: String,
    pub check_runs: Vec<CheckRun>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_github_check_run_fields() {
        let check: CheckRun = serde_json::from_str(
            r#"{"id":42,"name":"Rust","head_sha":"abc","status":"in_progress","conclusion":null}"#,
        )
        .unwrap();
        assert_eq!(check.name, "Rust");
        assert!(check.conclusion.is_none());
    }
}
