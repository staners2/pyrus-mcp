/**
 * Simplified Pyrus API types
 */

// Configuration
export interface PyrusConfig {
  login: string;
  securityKey: string;
  baseUrl?: string;
  domain?: string;
}

// Authentication
export interface AuthRequest {
  login: string;
  security_key: string;
}

export interface AuthResponse {
  access_token: string;
  api_url: string;
  files_url: string;
}

// Core types
export type TaskAction = 'approve' | 'reject' | 'reopen' | 'complete';

// User profile
export interface PyrusProfile {
  person_id: number;
  first_name: string;
  last_name: string;
  email: string;
  locale: string;
  timezone_offset: number;
  organization_id: number;
  organization: {
    organization_id: number;
    name: string;
  };
}

// Person
export interface PyrusPerson {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

// Task
export interface PyrusTask {
  id: number;
  text: string;
  create_date: string;
  last_modified_date: string;
  due_date?: string;
  responsible?: PyrusPerson;
  author: PyrusPerson;
  participants?: PyrusPerson[];
  task_status: string;
  comments?: PyrusComment[];
}

// Comment
export interface PyrusComment {
  id: number;
  text?: string;
  create_date: string;
  author: PyrusPerson;
  action?: string;
}

// API requests
export interface CreateTaskRequest {
  text: string;
  responsible?: number;
  due_date?: string;
  participants?: number[];
  list_ids?: number[];
}

export interface UpdateTaskRequest {
  text?: string;
  action?: TaskAction;
  responsible?: number;
  due_date?: string;
  participants?: number[];
}

export interface MoveTaskRequest {
  list_id: number;
  responsible?: number;
}

// API responses
export interface CreateTaskResponse {
  task: PyrusTask;
}

export interface GetTaskResponse {
  task: PyrusTask;
}

export interface UpdateTaskResponse {
  task: PyrusTask;
}

// MCP tool parameters
export interface CreateTaskParams {
  text: string;
  responsible?: number;
  due_date?: string;
  participants?: number[];
  list_ids?: number[];
}

export interface GetTaskParams {
  task_id: number;
}

export interface UpdateTaskParams {
  task_id: number;
  text?: string;
  action?: TaskAction;
  responsible?: number;
  due_date?: string;
  participants?: number[];
}

export interface MoveTaskParams {
  task_id: number;
  list_id: number;
  responsible?: number;
}