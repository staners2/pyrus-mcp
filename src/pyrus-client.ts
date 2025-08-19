/**
 * Simplified Pyrus API client
 * No validation, just core functionality
 */

import axios, { AxiosInstance } from 'axios';
import {
  PyrusConfig,
  PyrusTask,
  PyrusProfile,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
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
      const response = await this.axiosInstance.post(`/tasks/${taskId}/comments`, {
        action: 'move',
        list_id: moveData.list_id,
        responsible: moveData.responsible
      });
      return response.data.task;
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
}