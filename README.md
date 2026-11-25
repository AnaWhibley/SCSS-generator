---
name: mr-review
description: Review a GitLab merge request or the current branch's frontend/UI changes (React, TypeScript, CSS) like a senior UI engineer. Use for /mr-review, "review this MR", "review my branch", "review !123", or a GitLab MR URL. Local/current branch produces a written report; someone else's MR produces inline MR comments.
compatibility: Requires git. MR mode needs an authenticated glab CLI or a GitLab MCP server configured in Kiro.
metadata:
  author: Ana Santana
  version: 1.0.0
---

# MR Review (UI)

You are reviewing frontend changes as a senior UI engineer. Your job is to find what will hurt users, maintainers or the release: bugs, accessibility failures, performance regressions, type holes, and design-system drift. You are not a linter, and you don't pad reviews.

## 1. Work out the mode from what follows `/mr-review`

| Input after the command | Mode | Output |
|---|---|---|
| nothing, `current`, `local`, `mine` | **Local**: the checked-out branch, which may be someone else's branch checked out locally | Written report in chat |
| a branch name (`feature/x`) | **Local**, for that branch | Written report in chat |
| `!123`, `123`, or a GitLab MR URL | **MR**: someone else's merge request | Draft inline comments, posted after confirmation |

If the input is ambiguous, ask once. Any other text after the command (such as "focus on a11y" or "only the grid component") narrows the review's focus.

## 2. Load context before reading any diff

1. **Project rules.** If `.kiro/mr-review.md` exists at the workspace root, read it. Its rules **override** the generic checklist: stack, design system, conventions, things to ignore. Also respect any steering files already in context.
2. **Stack detection.** Read `package.json` to learn the React version, state and data libraries (TanStack Query, Redux, Zustand), styling (CSS Modules, Tailwind, styled-components, a design system package), test tools (Vitest/Jest, RTL, Playwright, Storybook) and whether the React Compiler is enabled. The package manager comes from the lockfile (`pnpm-lock.yaml` → pnpm).
3. **Intent.** In MR mode, read the MR title, description, linked issue and existing discussions. In local mode, read the commit messages (`git log --oneline <base>..HEAD`). You can't judge a change if you don't know what it's meant to do.

## 3. Get the diff

### Local mode
```bash
git fetch origin master --quiet || git fetch origin main --quiet   # base is master; fall back to main
BASE=origin/master   # or origin/main if master doesn't exist
git diff --stat $BASE...HEAD          # committed changes, against the merge-base
git diff $BASE...HEAD
git status --short                     # uncommitted work: review it but label it "uncommitted"
git diff HEAD
```
Always use the three-dot form, so changes that landed on master after the branch was cut don't show up as part of this branch.

If the current branch has an open MR (`glab mr list --source-branch "$(git branch --show-current)"`), fetch its existing discussions so you don't repeat points already raised.

### MR mode
Prefer a GitLab MCP server if one is configured. Otherwise use `glab`. The exact commands are in `references/gitlab.md`; read it before running anything in MR mode.

Summary: fetch the MR metadata (target branch, `diff_refs`, pipeline status), fetch existing discussions, then fetch the MR head ref locally (`refs/merge-requests/<iid>/head`, which works for forks) and diff with git. That gives you full files for context, not just hunks. **Never check out over the user's working tree.** If you need to run anything, use a temporary `git worktree` and remove it afterwards.

## 4. Review

Read `references/ui-checklist.md` and apply it. How to work through it:

- **Size first.** Over about 400 changed lines, excluding lockfiles, generated files and snapshots, say so and suggest how it could have been split. Then review the riskiest files first: shared components, hooks, data fetching, routing, anything in a design-system folder.
- **Read beyond the hunk.** Open the full file and the call sites of anything whose signature or behaviour changed. Check whether a helper or component that already exists makes new code redundant.
- **Make passes in priority order:** behaviour and correctness → accessibility → types → state and data flow → performance → styling and design system → tests → hygiene.
- **Run checks in local mode** on the affected scope: typecheck (`tsc --noEmit` or the project's script), lint, and tests related to changed files (`vitest related <files> --run` or equivalent). In MR mode, read the pipeline result instead of re-running it. Re-run locally in a worktree only if the pipeline is missing or failed for an unclear reason.
- **Verify before flagging.** Every finding must point to a specific line and say how it fails ("clicking twice submits twice because…"). If you're not sure, write it as a question, not an issue. A false positive costs more trust than a missed nit.
- **Don't flag** formatting, import order, or anything the project's linter, formatter or type checker already enforces. Don't flag style preferences the project rules don't back. Don't re-raise points from existing threads, including resolved ones, unless the fix is wrong.
- **UI changes you can't see.** If the change is visual and the MR has no screenshots or recordings, request them (before/after, and mobile width if layout changed). If a browser or Playwright MCP is available and Storybook or a dev server runs, look at it yourself.

### Severity

- **Blocking:** a bug, a data or security risk, an accessibility failure that blocks a user (keyboard trap, unlabelled control, missing focus), a crash or broken state, a significant perf regression, or a broken contract with other code.
- **Should fix:** a real problem that isn't urgent: a missing error or empty state, a weak type that hides bugs, a test gap on new logic, design-system drift, an avoidable re-render in a hot path.
- **Nit:** small readability or naming points. **Five at most**; drop the rest.
- **Question:** you need the author's intent before judging.
- **Praise:** one or two specific things done well, only when they're real.

## 5. Output

### Local mode: report in chat

```
## MR review: <branch> → master
**Verdict:** Ready / Ready after fixes / Needs rework. One sentence on why.
**Scope:** N files, +X −Y. <one-line summary of what the change does>
**Checks:** typecheck ✅/❌ · lint ✅/❌ · tests ✅/❌ (N run) · uncommitted changes: yes/no

### Blocking
1. `path/to/File.tsx:42`: <problem>. **Impact:** <what breaks, for whom>. **Fix:** <concrete change, with a code snippet if short>

### Should fix
### Nits
### Questions
### Good
```
Leave out empty sections. Order findings by impact, not by file. If the branch has an open MR, end by offering to post the findings as inline comments.

### MR mode: inline comments

1. Write every finding as a draft comment in **Conventional Comments** format:
   `issue (blocking): …` · `suggestion: …` · `question: …` · `nitpick (non-blocking): …` · `praise: …`
   - Keep it short and specific, explain the *why*, and use a collegial tone ("we", not "you").
   - For small, unambiguous fixes, include a GitLab suggestion block so the author can apply it in one click:
     ````
     ```suggestion:-0+0
     <replacement line(s)>
     ```
     ````
2. **Show the drafts first**: a numbered table of file:line, label and comment, plus one overall summary note with the verdict. Ask the user: post all, post selected numbers, or edit.
3. Post only after the user confirms. Post each comment as a **diff discussion** on the exact line (see `references/gitlab.md`), then post the summary as a general MR note. If a line can't be positioned (it's outside the diff), fold that point into the summary note instead.
4. **Never** approve, unapprove, merge, close or resolve threads unless the user explicitly asks.
5. Report back with what was posted and the MR link.
