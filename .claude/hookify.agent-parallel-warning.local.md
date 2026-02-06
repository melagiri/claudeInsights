---
name: agent-parallel-dependency-check
enabled: true
event: all
action: warn
tool_matcher: Task
conditions:
  - field: prompt
    operator: regex_match
    pattern: (parallel|concurrently|simultaneously|at the same time)
---

**Parallel Agent Dependency Check**

Before running agents in parallel, verify NO output dependencies exist:

**Common Sequential Patterns (DO NOT parallelize):**
```
TA (type alignment)   → CLI engineer (needs type decision)
TA (type alignment)   → Web engineer (needs type decision)
CLI engineer (types)  → Web engineer (needs CLI types to match)
```

**Safe to Parallelize:**
- Independent research/exploration tasks
- CLI bug fix + Web UI fix (if no shared types involved)
- Read-only codebase analysis

**Pre-Spawn Checklist:**
- [ ] No agent produces types/schema another agent needs?
- [ ] No shared Firestore collection changes?
- [ ] No cross-repo type dependencies?
- [ ] CLI and Web changes are truly independent?

If ANY dependency exists → Run sequentially instead.

**Example of DANGEROUS parallelization:**
- CLI engineer adds field to Session type + Web engineer reads Session type
  → Web will read stale type definition → Runtime mismatch

**Example of SAFE parallelization:**
- CLI engineer adds new command flag + Web engineer fixes CSS on insights page
  → No shared state, safe to run in parallel
