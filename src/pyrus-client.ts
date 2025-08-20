/**
 * Simplified Pyrus API client
 * No validation, just core functionality
 */

import axios, { AxiosInstance } from 'axios';
import {
  PyrusConfig,
  PyrusTask,
  PyrusProfile,
  PyrusList,
  PyrusComment,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  GetListTasksRequest,
  AddCommentRequest,
  AuthRequest
} from './types.js';
import { logger, httpClient } from './utilities.js';

export class PyrusClient {
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private readonly login: string;
  private readonly securityKey: string;
  private readonly axiosInstance: AxiosInstance;
  private readonly authAxiosInstance: AxiosInstance;
  
  private accessToken: string | null = null;
  private tokenExpires: number = 0;
  
  // Simple profile cache
  private profileCache: { profile: PyrusProfile; expires: number } | null = null;
  
  // Simple lists cache
  private listsCache: { lists: PyrusList[]; expires: number } | null = null;

  constructor(config: PyrusConfig) {
    this.login = config.login;
    this.securityKey = config.securityKey;
    
    const domain = config.domain || 'pyrus.com';
    this.baseUrl = config.baseUrl || `https://api.${domain}/v4`;
    this.authUrl = `https://accounts.${domain}/api/v4/auth`;

    // Create axios instances
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'pyrus-mcp/1.0.0'
      }
    });

    this.authAxiosInstance = axios.create({
      baseURL: this.authUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'pyrus-mcp/1.0.0'
      }
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return; // Token is still valid
    }

    await this.authenticate();
  }

  /**
   * Authenticate with Pyrus API
   */
  private async authenticate(): Promise<void> {
    const authRequest: AuthRequest = {
      login: this.login,
      security_key: this.securityKey
    };

    try {
      const response = await httpClient.execute(async () => {
        return this.authAxiosInstance.post('/', authRequest);
      }, 'Authentication');

      this.accessToken = response.data.access_token;
      // Set expiration to 50 minutes (tokens typically last 1 hour)
      this.tokenExpires = Date.now() + (50 * 60 * 1000);
      
      logger.info('Authentication successful');
    } catch (error) {
      logger.error('Authentication failed', { error });
      throw new Error('Failed to authenticate with Pyrus API');
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskRequest): Promise<PyrusTask> {
    return httpClient.execute(async () => {
      const response = await this.axiosInstance.post('/tasks', taskData);
      return response.data.task;
    }, 'Create task');
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: number): Promise<PyrusTask> {
    return httpClient.execute(async () => {
      const response = await this.axiosInstance.get(`/tasks/${taskId}`);
      return response.data.task;
    }, `Get task ${taskId}`);
  }

  /**
   * Update a task
   */
  async updateTask(taskId: number, updateData: UpdateTaskRequest): Promise<PyrusTask> {
    return httpClient.execute(async () => {
      const response = await this.axiosInstance.post(`/tasks/${taskId}/comments`, updateData);
      return response.data.task;
    }, `Update task ${taskId}`);
  }

  /**
   * Move task to different list
   */
  async moveTask(taskId: number, moveData: MoveTaskRequest): Promise<PyrusTask> {
    return httpClient.execute(async () => {
      const updateData: UpdateTaskRequest = {
        added_list_ids: [moveData.list_id]
      };
      
      if (moveData.responsible) {
        updateData.responsible = moveData.responsible;
      }
      
      return this.updateTask(taskId, updateData);
    }, `Move task ${taskId}`);
  }

  /**
   * Get current user profile (with caching)
   */
  async getProfile(): Promise<PyrusProfile> {
    // Check cache first
    if (this.profileCache && Date.now() < this.profileCache.expires) {
      return this.profileCache.profile;
    }

    const profile = await httpClient.execute(async () => {
      const response = await this.axiosInstance.get('/profile');
      return response.data;
    }, 'Get profile');

    // Cache for 5 minutes
    this.profileCache = {
      profile,
      expires: Date.now() + (5 * 60 * 1000)
    };

    return profile;
  }

  /**
   * Get all lists/forms available to the user (with caching)
   */
  async getLists(): Promise<PyrusList[]> {
    // Check cache first
    if (this.listsCache && Date.now() < this.listsCache.expires) {
      return this.listsCache.lists;
    }

    const lists = await httpClient.execute(async () => {
      const response = await this.axiosInstance.get('/lists');
      return response.data.lists || response.data;
    }, 'Get lists');

    // Cache for 5 minutes
    this.listsCache = {
      lists,
      expires: Date.now() + (5 * 60 * 1000)
    };

    return lists;
  }

  /**
   * Find list by name (case-insensitive search)
   */
  async findList(name: string): Promise<PyrusList | null> {
    const lists = await this.getLists();
    const searchName = name.toLowerCase().trim();
    
    return lists.find(list => 
      list.name.toLowerCase().includes(searchName)
    ) || null;
  }

  /**
   * Get tasks from a specific list with filtering options
   */
  async getListTasks(listId: number, filters: GetListTasksRequest = {}): Promise<PyrusTask[]> {
    return httpClient.execute(async () => {
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters.item_count !== undefined) {
        params.append('item_count', filters.item_count.toString());
      }
      if (filters.include_archived !== undefined) {
        params.append('include_archived', filters.include_archived.toString());
      }
      // According to Pyrus API documentation, only modified_after/before are supported
      if (filters.modified_after) {
        params.append('modified_after', filters.modified_after);
      }
      if (filters.modified_before) {
        params.append('modified_before', filters.modified_before);
      }
      // Keep created_* and due_* for potential future use or custom filtering
      if (filters.created_after) {
        params.append('created_after', filters.created_after);
      }
      if (filters.created_before) {
        params.append('created_before', filters.created_before);
      }
      if (filters.due_after) {
        params.append('due_after', filters.due_after);
      }
      if (filters.due_before) {
        params.append('due_before', filters.due_before);
      }

      const queryString = params.toString();
      const url = `/lists/${listId}/tasks${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.axiosInstance.get(url);
      return response.data.tasks || response.data;
    }, `Get tasks for list ${listId}`);
  }

  /**
   * Get related tasks for a specific task
   * This extracts related tasks from the main task response
   */
  async getRelatedTasks(taskId: number): Promise<PyrusTask[]> {
    return httpClient.execute(async () => {
      const task = await this.getTask(taskId);
      return task.related_tasks || [];
    }, `Get related tasks for task ${taskId}`);
  }

  /**
   * Add a comment to a task
   */
  async addComment(taskId: number, commentData: AddCommentRequest): Promise<PyrusTask> {
    return httpClient.execute(async () => {
      const response = await this.axiosInstance.post(`/tasks/${taskId}/comments`, commentData);
      return response.data.task;
    }, `Add comment to task ${taskId}`);
  }

  /**
   * Get all comments for a task
   */
  async getTaskComments(taskId: number): Promise<PyrusComment[]> {
    return httpClient.execute(async () => {
      const task = await this.getTask(taskId);
      return task.comments || [];
    }, `Get comments for task ${taskId}`);
  }

  /**
   * Find which lists contain the specified task
   */
  async getTaskLists(taskId: number): Promise<PyrusList[]> {
    return httpClient.execute(async () => {
      const allLists = await this.getLists();
      const taskLists: PyrusList[] = [];

      // Check each list to see if it contains our task
      for (const list of allLists) {
        try {
          const listTasks = await this.getListTasks(list.id, { item_count: 1000 });
          const hasTask = listTasks.some(task => task.id === taskId);
          if (hasTask) {
            taskLists.push(list);
          }
        } catch (error) {
          // Skip lists that we can't access (e.g., insufficient permissions)
          continue;
        }
      }

      return taskLists;
    }, `Get lists for task ${taskId}`);
  }
}