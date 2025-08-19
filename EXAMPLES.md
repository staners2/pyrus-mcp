# Usage Examples

Here are practical examples of how to use the Pyrus MCP tools:

## 1. Get Profile Information

```
get_profile()
```

This will return your Pyrus user profile with name, email, role, and organization information.

## 2. Create a Simple Task

```
create_task({
  "text": "Review quarterly reports and prepare summary"
})
```

Creates a basic task with just the description.

## 3. Create a Task with Due Date and Assignment

```
create_task({
  "text": "Complete website redesign mockups",
  "responsible": 12345,
  "due_date": "2024-09-15",
  "participants": [12345, 67890]
})
```

Creates a task assigned to user ID 12345, due September 15th, with participants.

## 4. Get Task Details

```
get_task({
  "task_id": 98765
})
```

Retrieves full details of task with ID 98765.

## 5. Add Comment to Task

```
update_task({
  "task_id": 98765,
  "text": "Added new requirements based on client feedback"
})
```

Adds a comment to the specified task.

## 6. Approve Task

```
update_task({
  "task_id": 98765,
  "text": "Looks good, approved for implementation",
  "action": "approve"
})
```

Approves the task with a comment.

## 7. Complete Task

```
update_task({
  "task_id": 98765,
  "text": "All requirements implemented and tested",
  "action": "complete"
})
```

Marks the task as completed.

## 8. Reassign Task

```
update_task({
  "task_id": 98765,
  "text": "Reassigning to development team",
  "responsible": 54321
})
```

Reassigns the task to a different user.

## 9. Set Due Date

```
update_task({
  "task_id": 98765,
  "text": "Updated deadline based on revised timeline",
  "due_date": "2024-10-01"
})
```

Updates the task's due date.

## 10. Move Task to Different List

```
move_task({
  "task_id": 98765,
  "list_id": 456,
  "responsible": 12345
})
```

Moves the task to a different list (like moving from "To Do" to "In Progress").

## 11. Reject Task

```
update_task({
  "task_id": 98765,
  "text": "Requirements are unclear, needs more details",
  "action": "reject"
})
```

Rejects the task with explanation.

## 12. Reopen Completed Task

```
update_task({
  "task_id": 98765,
  "text": "Found additional issues, reopening for fixes",
  "action": "reopen"
})
```

Reopens a previously completed or rejected task.

## Tips for Effective Usage

1. **Always provide meaningful comments** when updating tasks to maintain clear communication.

2. **Use specific due dates** in ISO format (YYYY-MM-DD) for better task management.

3. **Include relevant participants** when creating tasks that require collaboration.

4. **Check task status** with `get_task` before performing actions like approval or completion.

5. **Use appropriate actions** (`approve`, `reject`, `complete`, `reopen`) to maintain proper workflow states.

## Common User ID Discovery

To find user IDs for assignments:
1. Use `get_profile()` to see your own user ID
2. Check existing tasks with `get_task()` to see participant IDs
3. Use Pyrus web interface to find team member IDs in user profiles

## Error Handling

The MCP server provides detailed error messages for common issues:
- Invalid task IDs
- Missing required parameters
- API authentication problems
- Network connectivity issues

Always check the error message for guidance on resolving issues.