# Jules AI Delegation Rules

When operating with the `jules-ai` MCP server in Antigravity:

1. **Pre-flight Check**: Verify that the target repository name is properly qualified as `owner/repo` before invoking `jules_create_task`.
2. **Review First**: Unless the user explicitly requested instant execution or auto-approval, never bypass the plan inspection step.
3. **No Busy-Waiting**: Never loop-poll `jules_get_task_status`. Use asynchronous notifications or check on user demand.
4. **Clean PR Handover**: When Jules completes a task and opens a PR, fetch the diff using `jules_get_diff` and report both the PR link and a concise summary to the user.
