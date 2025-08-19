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
  PyrusConfig,
} from './types.js';
import { logger } from './utilities.js';

class PyrusMCPServer {
  private server: Server;
  private pyrusClient: PyrusClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'pyrus-mcp',
        version: '1.0.0',
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
           (task.comments?.length ? `Comments: ${task.comments.length}\n` : '');
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('Pyrus MCP server running', {
        version: '1.0.0',
        capabilities: ['create_task', 'get_task', 'update_task', 'move_task', 'get_profile']
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

// Start the server
startServer();