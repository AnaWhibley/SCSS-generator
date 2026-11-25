# GitLab commands for MR mode

If a GitLab MCP server is configured in Kiro, use its equivalent tools (get MR, get diffs, list discussions, create discussion or note) and the same flow. Otherwise use `glab`, which must be authenticated (`glab auth status`). Run commands from inside the repo so the `:id` placeholder resolves to the current project.

`<iid>` is the MR number shown as `!123`. For a URL like `https://gitlab.example.com/group/proj/-/merge_requests/123`, the iid is `123`. If the URL's project isn't the current repo, add `-R group/proj` to `glab` commands and use the URL-encoded project path instead of `:id` in API paths.

## 1. Metadata, pipeline and existing discussions

```bash
glab api "projects/:id/merge_requests/<iid>" > /tmp/mr-<iid>.json
# Fields needed: title, description, author.username, source_branch, target_branch,
# diff_refs.{base_sha,start_sha,head_sha}, head_pipeline.status, web_url, draft

glab api --paginate "projects/:id/merge_requests/<iid>/discussions" > /tmp/mr-<iid>-discussions.json
# Note each thread's file/line (position.new_path/new_line), whether it's resolved, and its gist. Don't duplicate these.
```

If `head_pipeline.status` is `failed`, find out which job failed (`glab ci view` or `glab api "projects/:id/pipelines/<pipeline_id>/jobs"`) and mention it in the summary. Don't re-review what the failing job already reports.

## 2. Get the code locally (without touching the working tree)

```bash
git fetch origin "refs/merge-requests/<iid>/head:refs/remotes/origin/mr-<iid>" --quiet   # works for forks too
git fetch origin "<target_branch>" --quiet
git diff --stat <base_sha>...origin/mr-<iid>
git diff <base_sha>...origin/mr-<iid>
git show origin/mr-<iid>:path/to/File.tsx       # full file for context
```

Only if you need to run typecheck, lint or tests (pipeline missing or unclear):
```bash
git worktree add /tmp/mr-<iid> origin/mr-<iid>
# cd /tmp/mr-<iid> && <pm> install --frozen-lockfile && run checks
git worktree remove --force /tmp/mr-<iid>
```

## 3. Post an inline comment (diff discussion), only after the user confirms

Take SHAs from `diff_refs` in step 1. Build the body as JSON. Bracketed field names don't work in JSON bodies, so use `--input`:

```bash
cat > /tmp/mr-comment.json <<'EOF'
{
  "body": "issue (blocking): This `div` is clickable but not focusable or keyboard-operable...\n\n```suggestion:-0+0\n<button type=\"button\" onClick={onSelect}>\n```",
  "position": {
    "position_type": "text",
    "base_sha":  "<diff_refs.base_sha>",
    "start_sha": "<diff_refs.start_sha>",
    "head_sha":  "<diff_refs.head_sha>",
    "old_path":  "src/components/Row.tsx",
    "new_path":  "src/components/Row.tsx",
    "new_line":  42
  }
}
EOF
glab api -X POST "projects/:id/merge_requests/<iid>/discussions" --input /tmp/mr-comment.json
```

Line rules:
- **Added line** (`+`): set `new_line` only.
- **Removed line** (`-`): set `old_line` only.
- **Unchanged context line**: set both `old_line` and `new_line`.
- **Renamed file**: `old_path` is the old name and `new_path` the new one.
- If the API returns 400 (line not in diff), don't retry with guesses. Move the point into the summary note.

Suggestion blocks: `suggestion:-0+0` replaces only the commented line. `-1+2` would cover 1 line above and 2 below. The replacement must be the full final text of those lines.

## 4. Post the summary note (general MR comment)

```bash
glab mr note <iid> -m "<summary>"
```

Summary format:
```
**Review summary:** <Approve / Approve after fixes / Needs rework>. <one-sentence reason>
- Blocking: N · Should fix: N · Nits: N · Questions: N
- <any point that couldn't be placed inline>
- Pipeline: <status>
```

## Never do this without an explicit request

`glab mr approve`, `glab mr revoke`, `glab mr merge`, `glab mr close`, resolving or unresolving threads, editing or deleting other people's comments, or pushing to the author's branch.
