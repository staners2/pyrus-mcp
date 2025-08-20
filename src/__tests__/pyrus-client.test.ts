import { PyrusClient } from '../pyrus-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PyrusClient', () => {
  const mockConfig = {
    login: 'test@example.com',
    securityKey: 'valid-key-123',
    domain: 'pyrus.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn()
        }
      }
    } as any);
  });

  test('should create client with valid config', () => {
    expect(() => new PyrusClient(mockConfig)).not.toThrow();
  });

  test('should construct correct URLs', () => {
    new PyrusClient(mockConfig);
    
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.pyrus.com/v4'
      })
    );
  });

  test('should handle custom domain', () => {
    const customConfig = { ...mockConfig, domain: 'custom.com' };
    new PyrusClient(customConfig);
    
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.custom.com/v4'
      })
    );
  });

  test('should use custom baseUrl when provided', () => {
    const customConfig = { ...mockConfig, baseUrl: 'https://custom-api.com/v4' };
    new PyrusClient(customConfig);
    
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://custom-api.com/v4'
      })
    );
  });

  describe('New API methods', () => {
    let client: PyrusClient;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          request: {
            use: jest.fn()
          }
        }
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance);
      client = new PyrusClient(mockConfig);
    });

    describe('getLists', () => {
      test('should get all lists', async () => {
        const mockLists = [
          { id: 1, name: 'List 1' },
          { id: 2, name: 'List 2' }
        ];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { lists: mockLists }
        });

        const result = await client.getLists();
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/lists');
        expect(result).toEqual(mockLists);
      });

      test('should handle response without lists wrapper', async () => {
        const mockLists = [
          { id: 1, name: 'List 1' }
        ];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: mockLists
        });

        const result = await client.getLists();
        expect(result).toEqual(mockLists);
      });
    });

    describe('findList', () => {
      test('should find list by name (case-insensitive)', async () => {
        const mockLists = [
          { id: 1, name: 'Task Management' },
          { id: 2, name: 'Project Planning' }
        ];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { lists: mockLists }
        });

        const result = await client.findList('task');
        
        expect(result).toEqual({ id: 1, name: 'Task Management' });
      });

      test('should return null if no list found', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { lists: [] }
        });

        const result = await client.findList('nonexistent');
        expect(result).toBeNull();
      });

      test('should cache lists', async () => {
        const mockLists = [{ id: 1, name: 'Test List' }];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { lists: mockLists }
        });

        // First call should hit the API
        const result1 = await client.getLists();
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/lists');
        expect(result1).toEqual(mockLists);

        // Second call should use cache (no additional API call)
        mockAxiosInstance.get.mockClear();
        const result2 = await client.getLists();
        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result2).toEqual(mockLists);
      });
    });

    describe('getListTasks', () => {
      test('should get tasks from list with no filters', async () => {
        const mockTasks = [
          { id: 1, text: 'Task 1' },
          { id: 2, text: 'Task 2' }
        ];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { tasks: mockTasks }
        });

        const result = await client.getListTasks(1);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/lists/1/tasks');
        expect(result).toEqual(mockTasks);
      });

      test('should get tasks with filters', async () => {
        const mockTasks = [{ id: 1, text: 'Task 1' }];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { tasks: mockTasks }
        });

        const filters = {
          item_count: 10,
          include_archived: true,
          created_after: '2024-01-01',
          due_before: '2024-12-31'
        };

        const result = await client.getListTasks(1, filters);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          '/lists/1/tasks?item_count=10&include_archived=true&created_after=2024-01-01&due_before=2024-12-31'
        );
        expect(result).toEqual(mockTasks);
      });

      test('should get tasks with modified filters', async () => {
        const mockTasks = [{ id: 1, text: 'Task 1' }];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { tasks: mockTasks }
        });

        const filters = {
          modified_after: '2024-01-01',
          modified_before: '2024-12-31'
        };

        const result = await client.getListTasks(1, filters);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          '/lists/1/tasks?modified_after=2024-01-01&modified_before=2024-12-31'
        );
        expect(result).toEqual(mockTasks);
      });
    });

    describe('getRelatedTasks', () => {
      test('should get related tasks', async () => {
        const relatedTasks = [
          { id: 2, text: 'Related Task 1' },
          { id: 3, text: 'Related Task 2' }
        ];
        
        const mockTask = {
          id: 1,
          text: 'Main Task',
          related_tasks: relatedTasks
        };
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { task: mockTask }
        });

        const result = await client.getRelatedTasks(1);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks/1');
        expect(result).toEqual(relatedTasks);
      });

      test('should return empty array if no related tasks', async () => {
        const mockTask = {
          id: 1,
          text: 'Main Task'
          // no related_tasks property
        };
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { task: mockTask }
        });

        const result = await client.getRelatedTasks(1);
        
        expect(result).toEqual([]);
      });
    });

    describe('addComment', () => {
      test('should add comment to task', async () => {
        const mockTask = { id: 1, text: 'Task with new comment' };
        
        mockAxiosInstance.post.mockResolvedValue({
          data: { task: mockTask }
        });

        const result = await client.addComment(1, { text: 'New comment' });
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/tasks/1/comments',
          { text: 'New comment' }
        );
        expect(result).toEqual(mockTask);
      });
    });

    describe('getTaskComments', () => {
      test('should get task comments', async () => {
        const mockComments = [
          { id: 1, text: 'Comment 1' },
          { id: 2, text: 'Comment 2' }
        ];
        
        const mockTask = {
          id: 1,
          text: 'Task text',
          comments: mockComments
        };
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { task: mockTask }
        });

        const result = await client.getTaskComments(1);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks/1');
        expect(result).toEqual(mockComments);
      });

      test('should return empty array if no comments', async () => {
        const mockTask = {
          id: 1,
          text: 'Task text'
        };
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { task: mockTask }
        });

        const result = await client.getTaskComments(1);
        expect(result).toEqual([]);
      });
    });
  });
});