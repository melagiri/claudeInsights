---
name: cross-repo-type-sync
enabled: true
event: all
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: (types\.ts|ParsedSession|ClaudeMessage|Insight\b|SessionCharacter|TitleSource|Project\b.*interface|Session\b.*interface)
---

**⚠️ Cross-Repo Type Sync Warning**

You're working with type definitions that exist in BOTH repositories:

```
CLI:  code-insights/cli/src/types.ts        (writes to Firestore)
Web:  code-insights-web/src/lib/types.ts    (reads from Firestore)
```

**Before proceeding, verify:**

| Check | Action |
|-------|--------|
| Adding a new field? | Must be **optional** (backward compatible) |
| Changing a field type? | Requires updating BOTH repos |
| Removing a field? | Check web dashboard doesn't read it |
| Adding a new type? | Decide which repo owns it |

**Key shared types:**
- `Project` / `Session` / `Insight` / `Message`
- `InsightType`: summary | decision | learning | technique
- `SessionCharacter`: deep_focus | bug_hunt | feature_build | exploration | refactor | learning | quick_task

**If you change types in one repo:**
1. Flag to `@technical-architect` for cross-repo alignment review
2. Do NOT merge until both repos are updated
3. New Firestore fields must be optional (existing data won't have them)

**Types are currently duplicated, not shared via npm package.** Manual alignment is required.
