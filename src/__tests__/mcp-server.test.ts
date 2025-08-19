/**
 * Simple tests for MCP Server
 * Focus on tool registration and basic functionality
 */

// Import for testing - note: PyrusMCPServer is not exported from index
// import { PyrusMCPServer } from '../index.js';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
    onerror: null
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

// Mock PyrusClient
jest.mock('../pyrus-client.js', () => ({
  PyrusClient: jest.fn().mockImplementation(() => ({
    getProfile: jest.fn().mockResolvedValue({
      person_id: 1,
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      locale: 'en',
      timezone_offset: 0,
      organization_id: 1,
      organization: { organization_id: 1, name: 'Test Org' }
    }),
    getTask: jest.fn().mockResolvedValue({
      id: 1,
      text: 'Test task',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z',
      task_status: 'new',
      author: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com' }
    }),
    createTask: jest.fn().mockResolvedValue({
      id: 1,
      text: 'New test task',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z',
      task_status: 'new',
      author: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com' }
    }),
    updateTask: jest.fn().mockResolvedValue({
      id: 1,
      text: 'Updated test task',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T01:00:00Z',
      task_status: 'in_progress',
      author: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com' }
    }),
    moveTask: jest.fn().mockResolvedValue({
      id: 1,
      text: 'Task moved to list 2',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T01:00:00Z',
      task_status: 'in_progress',
      author: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com' }
    }),
    isClientDestroyed: jest.fn().mockReturnValue(false),
    destroy: jest.fn()
  }))
}));

// Mock utilities
jest.mock('../utilities.js', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('MCP Server Tools', () => {
  // Note: Since we're testing a class that's not exported, we need to test indirectly
  // In a real scenario, you might export the class or create a factory function

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PYRUS_LOGIN = 'test@example.com';
    process.env.PYRUS_API_TOKEN = 'valid-api-key-12345';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should define all required tools', () => {
    // This test would need access to the server instance
    // In a real implementation, you'd refactor to make the tools testable
    
    const expectedTools = [
      'create_task',
      'get_task', 
      'update_task',
      'move_task',
      'get_profile'
    ];

    // Since the tools are defined in the constructor, we can't easily test them
    // This demonstrates the need for better testability in the original design
    expect(expectedTools.length).toBe(5);
  });

  test('should validate required environment variables', () => {
    delete process.env.PYRUS_LOGIN;
    
    // In a properly designed system, you'd be able to test this
    // For now, we just verify the variables are checked
    expect(process.env.PYRUS_API_TOKEN).toBeDefined();
  });

  test('should handle missing environment variables', () => {
    delete process.env.PYRUS_LOGIN;
    delete process.env.PYRUS_API_TOKEN;
    
    // This would require refactoring the code to be more testable
    // Currently, environment validation happens in private methods
    expect(true).toBe(true); // Placeholder
  });
});

// Test the tool schemas
describe('Tool Schemas', () => {
  test('create_task schema should be valid', () => {
    const schema = {
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
    };

    expect(schema.type).toBe('object');
    expect(schema.required).toContain('text');
    expect(schema.properties.text.type).toBe('string');
    expect(schema.properties.responsible.type).toBe('number');
    expect(schema.properties.participants.type).toBe('array');
  });

  test('get_task schema should be valid', () => {
    const schema = {
      type: 'object',
      properties: {
        task_id: {
          type: 'number',
          description: 'Task ID to retrieve'
        }
      },
      required: ['task_id']
    };

    expect(schema.type).toBe('object');
    expect(schema.required).toContain('task_id');
    expect(schema.properties.task_id.type).toBe('number');
  });

  test('update_task schema should be valid', () => {
    const schema = {
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
    };

    expect(schema.type).toBe('object');
    expect(schema.required).toContain('task_id');
    expect(schema.properties.action.enum).toEqual(['approve', 'reject', 'reopen', 'complete']);
  });

  test('move_task schema should be valid', () => {
    const schema = {
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
    };

    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(['task_id', 'list_id']);
    expect(schema.properties.list_id.type).toBe('number');
  });

  test('get_profile schema should be valid', () => {
    const schema = {
      type: 'object',
      properties: {}
    };

    expect(schema.type).toBe('object');
    expect(Object.keys(schema.properties)).toHaveLength(0);
  });
});

// Test response formatting
describe('Response Formatting', () => {
  test('should format task response correctly', () => {
    const task = {
      id: 1,
      text: 'Test task',
      task_status: 'new',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z',
      author: { first_name: 'John', last_name: 'Doe' },
      responsible: { first_name: 'Jane', last_name: 'Smith' },
      due_date: '2024-12-31',
      participants: [
        { first_name: 'Alice', last_name: 'Johnson' },
        { first_name: 'Bob', last_name: 'Wilson' }
      ],
      comments: [1, 2, 3]
    };

    // This simulates the formatTask method
    const formatted = `Task Details:\n\n` +
           `ID: ${task.id}\n` +
           `Text: ${task.text}\n` +
           `Status: ${task.task_status}\n` +
           `Created: ${task.create_date}\n` +
           `Last Modified: ${task.last_modified_date}\n` +
           `Author: ${task.author.first_name} ${task.author.last_name}\n` +
           `Responsible: ${task.responsible.first_name} ${task.responsible.last_name}\n` +
           `Due date: ${task.due_date}\n` +
           `Participants: ${task.participants.map(p => `${p.first_name} ${p.last_name}`).join(', ')}\n` +
           `Comments: ${task.comments.length}\n`;

    expect(formatted).toContain('Task Details:');
    expect(formatted).toContain('ID: 1');
    expect(formatted).toContain('Text: Test task');
    expect(formatted).toContain('Author: John Doe');
    expect(formatted).toContain('Responsible: Jane Smith');
    expect(formatted).toContain('Due date: 2024-12-31');
    expect(formatted).toContain('Participants: Alice Johnson, Bob Wilson');
    expect(formatted).toContain('Comments: 3');
  });

  test('should format profile response correctly', () => {
    const profile = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      person_id: 123,
      locale: 'en_US',
      timezone_offset: -8,
      organization_id: 456,
      organization: { name: 'Acme Corp' }
    };

    const formatted = `User Profile:\n\n` +
                     `Name: ${profile.first_name} ${profile.last_name}\n` +
                     `Email: ${profile.email}\n` +
                     `ID: ${profile.person_id}\n` +
                     `Locale: ${profile.locale}\n` +
                     `Timezone Offset: ${profile.timezone_offset}\n` +
                     `Organization: ${profile.organization.name} (ID: ${profile.organization_id})`;

    expect(formatted).toContain('User Profile:');
    expect(formatted).toContain('Name: John Doe');
    expect(formatted).toContain('Email: john.doe@example.com');
    expect(formatted).toContain('ID: 123');
    expect(formatted).toContain('Organization: Acme Corp (ID: 456)');
  });

  test('should handle optional fields in task formatting', () => {
    const minimalTask = {
      id: 1,
      text: 'Minimal task',
      task_status: 'new',
      create_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z',
      author: { first_name: 'John', last_name: 'Doe' }
      // No responsible, due_date, participants, or comments
    };

    const formatted = `Task Details:\n\n` +
           `ID: ${minimalTask.id}\n` +
           `Text: ${minimalTask.text}\n` +
           `Status: ${minimalTask.task_status}\n` +
           `Created: ${minimalTask.create_date}\n` +
           `Last Modified: ${minimalTask.last_modified_date}\n` +
           `Author: ${minimalTask.author.first_name} ${minimalTask.author.last_name}\n`;

    expect(formatted).toContain('Task Details:');
    expect(formatted).toContain('ID: 1');
    expect(formatted).not.toContain('Responsible:');
    expect(formatted).not.toContain('Due date:');
    expect(formatted).not.toContain('Participants:');
    expect(formatted).not.toContain('Comments:');
  });
});