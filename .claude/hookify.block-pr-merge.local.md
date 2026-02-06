---
name: block-pr-merge
enabled: true
event: bash
action: block
pattern: gh\s+pr\s+merge
---

**PR Merge Blocked**

Agents are **NEVER** authorized to merge pull requests in this project.

**Why this is blocked:**
- Only the founder manually merges PRs after review
- This ensures human oversight on all code entering main
- Triple-layer review process must complete first

**What to do instead:**
1. Report: "PR #XX is ready for merge"
2. Provide the PR link
3. STOP and wait for founder to merge manually

This is a hard block - the command will not execute.
