---
name: cli-binary-name
enabled: true
event: all
action: warn
conditions:
  - field: content
    operator: regex_match
    pattern: \bcode-insights\s+(init|sync|open|status|insights|reset|install-hook|uninstall-hook|link)\b
---

**Wrong CLI Binary Name Detected!**

The CLI binary is **`claudeinsight`**, NOT `code-insights`.

**Correct usage:**
```bash
claudeinsight init
claudeinsight sync
claudeinsight open
claudeinsight status
claudeinsight insights
claudeinsight install-hook
claudeinsight uninstall-hook
claudeinsight reset
```

**Also note:**
- There is no `link` command. The correct command is `open`.
- Package name is `@claudeinsight/cli`
- Config directory is `~/.claudeinsight/`

**Common mistakes:**
- ❌ `code-insights sync` → ✅ `claudeinsight sync`
- ❌ `code-insights link` → ✅ `claudeinsight open`
- ❌ `codeinsight sync` → ✅ `claudeinsight sync`
