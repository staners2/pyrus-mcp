#!/usr/bin/env node

/**
 * Simplified Pyrus MCP Server
 * Focuses on core functionality with clean, maintainable code
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { PyrusClient } from './pyrus-client.js';
import {
  CreateTaskParams,
  GetTaskParams,
  UpdateTaskParams,
  MoveTaskParams,
  FindListParams,
  GetListTasksParams,
  GetRelatedTasksParams,
  AddCommentParams,
  GetTaskCommentsParams,
  PyrusConfig,
} from './types.js';
import { logger } from './utilities.js';

// Version from package.json
const VERSION = '1.3.0';

class PyrusMCPServer {
  private server: Server;
  private pyrusClient: PyrusClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'pyrus-mcp',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP Server Error', { error: error instanceof Error ? error.message : String(error) });
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message });
      this.shutdown().finally(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { 
        reason: reason instanceof Error ? reason.message : String(reason)
      });
    });
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    try {
      await this.server.close();
      logger.info('Server shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Initialize Pyrus client
   */
  private initializePyrusClient(): void {
    const login = process.env.PYRUS_LOGIN;
    const securityKey = process.env.PYRUS_API_TOKEN;
    const baseUrl = process.env.PYRUS_BASE_URL;
    const domain = process.env.PYRUS_DOMAIN;

    if (!login) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'PYRUS_LOGIN environment variable is required'
      );
    }

    if (!securityKey) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'PYRUS_API_TOKEN environment variable is required'
      );
    }

    const config: PyrusConfig = {
      login,
      securityKey,
      ...(baseUrl && { baseUrl }),
      ...(domain && { domain })
    };

    this.pyrusClient = new PyrusClient(config);
    logger.debug('PyrusClient initialized');
  }

  /**
   * Get or create Pyrus client
   */
  private getPyrusClient(): PyrusClient {
    if (!this.pyrusClient) {
      this.initializePyrusClient();
    }
    return this.pyrusClient!;
  }

  /**
   * Setup MCP handlers
   */
  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_task',
            description: 'Create a new task in Pyrus',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Task description/text (required)'
                },
                responsible: {
                  type: 'number',
                  description: 'ID of the person responsible for the task (optional)'
                },
                due_date: {
                  type: 'string',
                  description: 'Due date in ISO format (YYYY-MM-DD) (optional)'
                },
                participants: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of participant IDs (optional)'
                },
                list_ids: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of list IDs to add task to (optional)'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'get_task',
            description: 'Get task details by ID',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to retrieve'
                }
              },
              required: ['task_id']
            }
          },
          {
            name: 'update_task',
            description: 'Update existing task (add comment, change status, reassign, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to update'
                },
                text: {
                  type: 'string',
                  description: 'Comment text (optional)'
                },
                action: {
                  type: 'string',
                  enum: ['approve', 'reject', 'reopen', 'complete'],
                  description: 'Action to perform on the task (optional)'
                },
                responsible: {
                  type: 'number',
                  description: 'New responsible person ID (optional)'
                },
                due_date: {
                  type: 'string',
                  description: 'New due date in ISO format (YYYY-MM-DD) (optional)'
                },
                participants: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of participant IDs (optional)'
                },
                list_ids: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of list IDs to tag task with (optional)'
                },
                added_list_ids: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of list IDs to add task to (optional)'
                },
                removed_list_ids: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of list IDs to remove task from (optional)'
                }
              },
              required: ['task_id']
            }
          },
          {
            name: 'move_task',
            description: 'Move task to different list/column',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to move'
                },
                list_id: {
                  type: 'number',
                  description: 'Target list ID'
                },
                responsible: {
                  type: 'number',
                  description: 'New responsible person ID (optional)'
                }
              },
              required: ['task_id', 'list_id']
            }
          },
          {
            name: 'get_profile',
            description: 'Get current user profile information',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_lists',
            description: 'Get all lists/forms available to the user',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'find_list',
            description: 'Find a list by name (case-insensitive search)',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'List name to search for'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'get_list_tasks',
            description: 'Get tasks from a specific list with filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                list_id: {
                  type: 'number',
                  description: 'List ID to get tasks from'
                },
                item_count: {
                  type: 'number',
                  description: 'Limit the number of tasks returned (optional)'
                },
                include_archived: {
                  type: 'boolean',
                  description: 'Include archived tasks (optional)'
                },
                modified_after: {
                  type: 'string',
                  description: 'Filter tasks modified after this date (ISO format YYYY-MM-DD) (optional)'
                },
                modified_before: {
                  type: 'string',
                  description: 'Filter tasks modified before this date (ISO format YYYY-MM-DD) (optional)'
                },
                created_after: {
                  type: 'string',
                  description: 'Filter tasks created after this date (ISO format YYYY-MM-DD) (optional)'
                },
                created_before: {
                  type: 'string',
                  description: 'Filter tasks created before this date (ISO format YYYY-MM-DD) (optional)'
                },
                due_after: {
                  type: 'string',
                  description: 'Filter tasks with due date after this date (ISO format YYYY-MM-DD) (optional)'
                },
                due_before: {
                  type: 'string',
                  description: 'Filter tasks with due date before this date (ISO format YYYY-MM-DD) (optional)'
                }
              },
              required: ['list_id']
            }
          },
          {
            name: 'get_related_tasks',
            description: 'Get tasks related to a specific task',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to get related tasks for'
                }
              },
              required: ['task_id']
            }
          },
          {
            name: 'add_comment',
            description: 'Add a comment to a task',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to add comment to'
                },
                text: {
                  type: 'string',
                  description: 'Comment text'
                }
              },
              required: ['task_id', 'text']
            }
          },
          {
            name: 'get_task_comments',
            description: 'Get all comments for a specific task',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'number',
                  description: 'Task ID to get comments for'
                }
              },
              required: ['task_id']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!name) {
          throw new McpError(ErrorCode.InvalidParams, 'Tool name is required');
        }

        const client = this.getPyrusClient();

        switch (name) {
          case 'create_task': {
            const params = args as unknown as CreateTaskParams;
            const task = await client.createTask(params);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTask(task, 'Task created successfully!')
                }
              ]
            };
          }

          case 'get_task': {
            const params = args as unknown as GetTaskParams;
            const task = await client.getTask(params.task_id);
            
            // Get lists information for the task
            try {
              const taskLists = await client.getTaskLists(params.task_id);
              (task as any).lists = taskLists;
            } catch (error) {
              logger.debug(`Could not get lists for task ${params.task_id}`, { error });
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTask(task, 'Task Details:')
                }
              ]
            };
          }

          case 'update_task': {
            const params = args as unknown as UpdateTaskParams;
            const { task_id, ...updateData } = params;
            const task = await client.updateTask(task_id, updateData);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTask(task, 'Task updated successfully!')
                }
              ]
            };
          }

          case 'move_task': {
            const params = args as unknown as MoveTaskParams;
            const { task_id, ...moveData } = params;
            const task = await client.moveTask(task_id, moveData);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTask(task, 'Task moved successfully!')
                }
              ]
            };
          }

          case 'get_profile': {
            const profile = await client.getProfile();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `User Profile:\n\n` +
                        `Name: ${profile.first_name} ${profile.last_name}\n` +
                        `Email: ${profile.email}\n` +
                        `ID: ${profile.person_id}\n` +
                        `Locale: ${profile.locale}\n` +
                        `Timezone Offset: ${profile.timezone_offset}\n` +
                        `Organization: ${profile.organization.name} (ID: ${profile.organization_id})`
                }
              ]
            };
          }

          case 'get_lists': {
            const lists = await client.getLists();
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatLists(lists, 'Available Lists:')
                }
              ]
            };
          }

          case 'find_list': {
            const params = args as unknown as FindListParams;
            const list = await client.findList(params.name);
            
            if (!list) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No list found with name containing: "${params.name}"`
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatList(list, 'Found List:')
                }
              ]
            };
          }

          case 'get_list_tasks': {
            const params = args as unknown as GetListTasksParams;
            const { list_id, ...filters } = params;
            const tasks = await client.getListTasks(list_id, filters);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTasks(tasks, `Tasks in List ${list_id}:`)
                }
              ]
            };
          }

          case 'get_related_tasks': {
            const params = args as unknown as GetRelatedTasksParams;
            const tasks = await client.getRelatedTasks(params.task_id);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTasks(tasks, `Related Tasks for Task ${params.task_id}:`)
                }
              ]
            };
          }

          case 'add_comment': {
            const params = args as unknown as AddCommentParams;
            const { task_id, text } = params;
            const task = await client.addComment(task_id, { text });
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatTask(task, 'Comment added successfully!')
                }
              ]
            };
          }

          case 'get_task_comments': {
            const params = args as unknown as GetTaskCommentsParams;
            const comments = await client.getTaskComments(params.task_id);
            
            return {
              content: [
                {
                  type: 'text',
                  text: this.formatComments(comments, `Comments for Task ${params.task_id}:`)
                }
              ]
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

      } catch (error) {
        logger.error('Tool call failed', {
          toolName: name,
          error: error instanceof Error ? error.message : String(error)
        });

        // Create safe error message
        let errorMessage = `Failed to execute ${name}`;
        let errorCode = ErrorCode.InternalError;
        
        if (error instanceof McpError) {
          errorMessage = error.message;
          errorCode = error.code;
        } else if (error instanceof Error) {
          if (error.message.toLowerCase().includes('invalid')) {
            errorMessage = error.message;
            errorCode = ErrorCode.InvalidParams;
          } else if (error.message.toLowerCase().includes('authentication')) {
            errorMessage = 'Authentication failed. Please check your credentials.';
            errorCode = ErrorCode.InvalidRequest;
          }
        }
        
        throw new McpError(errorCode, errorMessage);
      }
    });
  }

  /**
   * Format task for display
   */
  private formatTask(task: any, title: string): string {
    return `${title}\n\n` +
           `ID: ${task.id}\n` +
           `Text: ${task.text}\n` +
           `Status: ${task.task_status}\n` +
           `Created: ${task.create_date}\n` +
           `Last Modified: ${task.last_modified_date}\n` +
           `Author: ${task.author.first_name} ${task.author.last_name}\n` +
           (task.responsible ? `Responsible: ${task.responsible.first_name} ${task.responsible.last_name}\n` : '') +
           (task.due_date ? `Due date: ${task.due_date}\n` : '') +
           (task.participants?.length ? `Participants: ${task.participants.map((p: any) => `${p.first_name} ${p.last_name}`).join(', ')}\n` : '') +
           (task.lists?.length ? `Lists: ${task.lists.map((l: any) => `${l.name} (ID: ${l.id})`).join(', ')}\n` : '') +
           (task.comments?.length ? `Comments: ${task.comments.length}\n` : '') +
           (task.related_tasks?.length ? `Related Tasks: ${task.related_tasks.length} (IDs: ${task.related_tasks.map((t: any) => t.id).join(', ')})\n` : '');
  }

  /**
   * Format multiple tasks for display
   */
  private formatTasks(tasks: any[], title: string): string {
    if (!tasks || tasks.length === 0) {
      return `${title}\n\nNo tasks found.`;
    }

    let result = `${title}\n\nFound ${tasks.length} task(s):\n\n`;
    
    tasks.forEach((task, index) => {
      result += `${index + 1}. Task #${task.id}\n`;
      result += `   Text: ${task.text}\n`;
      result += `   Status: ${task.task_status}\n`;
      result += `   Created: ${task.create_date}\n`;
      if (task.responsible) {
        result += `   Responsible: ${task.responsible.first_name} ${task.responsible.last_name}\n`;
      }
      if (task.due_date) {
        result += `   Due date: ${task.due_date}\n`;
      }
      if (task.lists?.length) {
        result += `   Lists: ${task.lists.map((l: any) => `${l.name} (ID: ${l.id})`).join(', ')}\n`;
      }
      result += '\n';
    });

    return result;
  }

  /**
   * Format list for display
   */
  private formatList(list: any, title: string): string {
    return `${title}\n\n` +
           `ID: ${list.id}\n` +
           `Name: ${list.name}\n` +
           (list.header ? `Header: ${list.header}\n` : '') +
           (list.organization_id ? `Organization ID: ${list.organization_id}\n` : '') +
           (list.create_date ? `Created: ${list.create_date}\n` : '') +
           (list.last_modified_date ? `Last Modified: ${list.last_modified_date}\n` : '') +
           (list.fields?.length ? `Fields: ${list.fields.length}\n` : '');
  }

  /**
   * Format multiple lists for display
   */
  private formatLists(lists: any[], title: string): string {
    if (!lists || lists.length === 0) {
      return `${title}\n\nNo lists found.`;
    }

    let result = `${title}\n\nFound ${lists.length} list(s):\n\n`;
    
    lists.forEach((list, index) => {
      result += `${index + 1}. List #${list.id}\n`;
      result += `   Name: ${list.name}\n`;
      if (list.header) {
        result += `   Header: ${list.header}\n`;
      }
      if (list.create_date) {
        result += `   Created: ${list.create_date}\n`;
      }
      result += '\n';
    });

    return result;
  }

  /**
   * Format comments for display
   */
  private formatComments(comments: any[], title: string): string {
    if (!comments || comments.length === 0) {
      return `${title}\n\nNo comments found.`;
    }

    let result = `${title}\n\nFound ${comments.length} comment(s):\n\n`;
    
    comments.forEach((comment, index) => {
      result += `${index + 1}. Comment #${comment.id}\n`;
      result += `   Author: ${comment.author.first_name} ${comment.author.last_name}\n`;
      result += `   Date: ${comment.create_date}\n`;
      if (comment.text) {
        result += `   Text: ${comment.text}\n`;
      }
      if (comment.action) {
        result += `   Action: ${comment.action}\n`;
      }
      result += '\n';
    });

    return result;
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('Pyrus MCP server running', {
        version: VERSION,
        capabilities: [
          'create_task', 'get_task', 'update_task', 'move_task', 'get_profile',
          'get_lists', 'find_list', 'get_list_tasks', 'get_related_tasks', 
          'add_comment', 'get_task_comments'
        ]
      });
    } catch (error) {
      logger.error('Failed to start server transport', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
Pyrus MCP Server v${VERSION}
MCP server for Pyrus API integration

Usage:
  pyrus-mcp              Start the MCP server
  pyrus-mcp --version    Show version information
  pyrus-mcp --help       Show this help message

Environment Variables:
  PYRUS_LOGIN            Your Pyrus login (required)
  PYRUS_API_TOKEN        Your Pyrus API token (required)  
  PYRUS_BASE_URL         Custom Pyrus API base URL (optional)
  PYRUS_DOMAIN           Custom Pyrus domain (optional, default: pyrus.com)

Available Tools:
  • create_task          Create a new task
  • get_task            Get task details
  • update_task         Update existing task
  • move_task           Move task to different list
  • get_profile         Get user profile information
  • get_lists           Get all available lists
  • find_list           Find list by name
  • get_list_tasks      Get tasks from specific list
  • get_related_tasks   Get related tasks
  • add_comment         Add comment to task
  • get_task_comments   Get all task comments

For more information, visit: https://github.com/staners2/pyrus-mcp
`);
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    const server = new PyrusMCPServer();
    await server.run();
  } catch (error) {
    logger.error('Failed to start Pyrus MCP server', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    process.exit(1);
  }
}

/**
 * Main entry point
 */
function main(): void {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`pyrus-mcp v${VERSION}`);
    process.exit(0);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  // Start the MCP server
  startServer();
}

// Start the application
main();