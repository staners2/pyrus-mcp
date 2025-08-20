# API Reference

This document describes all available MCP tools provided by the Pyrus MCP server.

## Tools Overview

| Tool | Description |
|------|-------------|
| `create_task` | Create a new task in Pyrus |
| `get_task` | Retrieve task details by ID (includes related tasks) |
| `update_task` | Update existing task (comments, status, assignments) |
| `move_task` | Move task to different list/column |
| `get_profile` | Get current user profile information |
| `get_lists` | Get all lists/forms available to the user |
| `find_list` | Find a list by name (case-insensitive search) |
| `get_list_tasks` | Get tasks from a specific list with filtering options |
| `get_related_tasks` | Get tasks related to a specific task |
| `add_comment` | Add a comment to a task |
| `get_task_comments` | Get all comments for a specific task |

## create_task

Creates a new task in Pyrus.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | ✅ | Task description/text |
| `responsible` | number | ❌ | ID of the person responsible for the task |
| `due_date` | string | ❌ | Due date in ISO format (YYYY-MM-DD) |
| `participants` | number[] | ❌ | Array of participant user IDs |
| `list_ids` | number[] | ❌ | Array of list IDs to add the task to |

### Example

```json
{
  "text": "Review the quarterly report",
  "responsible": 12345,
  "due_date": "2024-01-31",
  "participants": [12345, 67890],
  "list_ids": [100, 200]
}
```

### Response

Returns created task details including ID, status, author, and assigned users.

## get_task

Retrieves task details by ID.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | ID of the task to retrieve |

### Example

```json
{
  "task_id": 12345
}
```

### Response

Returns complete task information including:
- Basic task details (ID, text, status)
- Dates (created, modified, due)
- People (author, responsible, participants)
- Comments count
- Related tasks (if any) with count and IDs

## update_task

Updates an existing task with new information or performs actions.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | ID of the task to update |
| `text` | string | ❌ | Comment text to add |
| `action` | string | ❌ | Action: 'approve', 'reject', 'reopen', 'complete' |
| `responsible` | number | ❌ | New responsible person ID |
| `due_date` | string | ❌ | New due date in ISO format (YYYY-MM-DD) |
| `participants` | number[] | ❌ | Array of participant user IDs |

### Example

```json
{
  "task_id": 12345,
  "text": "Updated the deadline based on client feedback",
  "action": "complete",
  "due_date": "2024-02-15"
}
```

### Response

Returns updated task details.

## move_task

Moves a task to a different list or column.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | ID of the task to move |
| `list_id` | number | ✅ | Target list ID |
| `responsible` | number | ❌ | New responsible person ID |

### Example

```json
{
  "task_id": 12345,
  "list_id": 200,
  "responsible": 67890
}
```

### Response

Returns task details after the move operation.

## get_profile

Gets current user profile information. No parameters required.

### Parameters

None.

### Example

```json
{}
```

### Response

Returns user profile including:
- Name and email
- User ID
- Locale and timezone
- Organization details

## get_lists

Gets all lists/forms available to the user. Results are cached for 5 minutes for performance.

### Parameters

None.

### Example

```json
{}
```

### Response

Returns an array of lists with:
- List ID and name
- Creation and modification dates
- Organization information
- Field count (if applicable)

## find_list

Finds a list by name using case-insensitive search.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | List name to search for (partial match) |

### Example

```json
{
  "name": "task management"
}
```

### Response

Returns the first matching list or null if no list found.

## get_list_tasks

Gets tasks from a specific list with optional filtering capabilities.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | number | ✅ | List ID to get tasks from |
| `item_count` | number | ❌ | Limit the number of tasks returned |
| `include_archived` | boolean | ❌ | Include archived tasks |
| `modified_after` | string | ❌ | Filter tasks modified after date (ISO YYYY-MM-DD) |
| `modified_before` | string | ❌ | Filter tasks modified before date (ISO YYYY-MM-DD) |
| `created_after` | string | ❌ | Filter tasks created after date (ISO YYYY-MM-DD) |
| `created_before` | string | ❌ | Filter tasks created before date (ISO YYYY-MM-DD) |
| `due_after` | string | ❌ | Filter tasks with due date after (ISO YYYY-MM-DD) |
| `due_before` | string | ❌ | Filter tasks with due date before (ISO YYYY-MM-DD) |

### Example

```json
{
  "list_id": 100,
  "item_count": 50,
  "modified_after": "2024-01-01",
  "include_archived": false
}
```

### Response

Returns an array of tasks from the specified list matching the filters.

## get_related_tasks

Gets tasks that are related to a specific task.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | Task ID to get related tasks for |

### Example

```json
{
  "task_id": 12345
}
```

### Response

Returns an array of related tasks or empty array if no related tasks exist.

## add_comment

Adds a comment to an existing task.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | Task ID to add comment to |
| `text` | string | ✅ | Comment text |

### Example

```json
{
  "task_id": 12345,
  "text": "Progress update: 75% complete"
}
```

### Response

Returns the updated task details including the new comment.

## get_task_comments

Gets all comments for a specific task.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | number | ✅ | Task ID to get comments for |

### Example

```json
{
  "task_id": 12345
}
```

### Response

Returns an array of comments with:
- Comment ID and text
- Author information
- Creation date
- Action type (if applicable)

## Error Handling

All tools return structured error responses for:

- **Authentication errors**: Invalid credentials
- **Authorization errors**: Insufficient permissions  
- **Validation errors**: Missing or invalid parameters
- **Not found errors**: Task or user doesn't exist
- **Network errors**: Connection issues

Error responses include descriptive messages to help diagnose issues.

## Rate Limits

The Pyrus API has rate limits. The MCP server handles:
- Automatic retry with exponential backoff
- Rate limit detection and appropriate delays
- Clear error messages when limits are exceeded

## Data Types

### Task Status

Common task statuses include:
- `new` - Newly created task
- `in_progress` - Task is being worked on  
- `completed` - Task is finished
- `cancelled` - Task was cancelled

### Date Format

All dates use ISO 8601 format: `YYYY-MM-DD`

Examples:
- `2024-01-15` - January 15, 2024
- `2024-12-31` - December 31, 2024