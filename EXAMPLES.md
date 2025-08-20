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

## 13. Get All Lists

```
get_lists()
```

Retrieves all lists/forms available to your user account.

## 14. Find List by Name

```
find_list({
  "name": "project"
})
```

Searches for lists containing "project" in their name (case-insensitive).

## 15. Get Tasks from Specific List

```
get_list_tasks({
  "list_id": 123
})
```

Gets all tasks from list with ID 123.

## 16. Get Tasks with Filtering

```
get_list_tasks({
  "list_id": 123,
  "item_count": 50,
  "created_after": "2024-01-01",
  "due_before": "2024-12-31",
  "include_archived": false
})
```

Gets up to 50 tasks from list 123, created after January 1st 2024, due before end of 2024, excluding archived tasks.

## 17. Get Related Tasks

```
get_related_tasks({
  "task_id": 98765
})
```

Finds tasks that are related or linked to task 98765.

## 18. Add Comment to Task

```
add_comment({
  "task_id": 98765,
  "text": "Status update: design phase completed, moving to development"
})
```

Adds a standalone comment to the task without changing its status.

## 19. Get All Task Comments

```
get_task_comments({
  "task_id": 98765
})
```

Retrieves all comments and activity history for task 98765.

## 20. Advanced List Task Filtering

```
get_list_tasks({
  "list_id": 456,
  "item_count": 10,
  "created_after": "2024-08-01",
  "created_before": "2024-08-31"
})
```

Gets the first 10 tasks from list 456 that were created in August 2024.

## Tips for Effective Usage

1. **Always provide meaningful comments** when updating tasks to maintain clear communication.

2. **Use specific due dates** in ISO format (YYYY-MM-DD) for better task management.

3. **Include relevant participants** when creating tasks that require collaboration.

4. **Check task status** with `get_task` before performing actions like approval or completion.

5. **Use appropriate actions** (`approve`, `reject`, `complete`, `reopen`) to maintain proper workflow states.

6. **Use list filtering** to narrow down large task sets and improve performance.

7. **Leverage task relationships** with `get_related_tasks` to understand task dependencies.

8. **Separate comments from status changes** - use `add_comment` for pure communication and `update_task` for status modifications.

## Common ID Discovery

### User IDs
To find user IDs for assignments:
1. Use `get_profile()` to see your own user ID
2. Check existing tasks with `get_task()` to see participant IDs
3. Use Pyrus web interface to find team member IDs in user profiles

### List IDs
To find list IDs for task organization:
1. Use `get_lists()` to see all available lists with their IDs
2. Use `find_list()` to search for specific lists by name
3. Check existing tasks with `get_task()` to see which lists they belong to

## Error Handling

The MCP server provides detailed error messages for common issues:
- Invalid task IDs
- Missing required parameters
- API authentication problems
- Network connectivity issues

Always check the error message for guidance on resolving issues.