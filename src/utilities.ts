/**
 * Simplified utilities with just logging functionality
 * Focuses on essential functionality with minimal complexity
 */

// =============================================================================
// LOGGER
// =============================================================================

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private level: LogLevel;
  private sensitiveKeys = new Set(['password', 'token', 'key', 'secret', 'auth', 'security_key']);

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.level = this.parseLogLevel(envLevel) ?? LogLevel.INFO;
  }

  private parseLogLevel(level?: string): LogLevel | undefined {
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return undefined;
    }
  }

  /**
   * Sanitize data for logging
   */
  private sanitize(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string') {
      return data.length > 1000 ? `${data.substring(0, 100)}...[${data.length} chars]` : data;
    }
    
    if (typeof data === 'object') {
      if (data instanceof Error) {
        return { name: data.name, message: data.message };
      }
      
      if (Array.isArray(data)) {
        return data.map(item => this.sanitize(item));
      }
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const isSensitive = Array.from(this.sensitiveKeys).some(sensitive => 
          key.toLowerCase().includes(sensitive)
        );
        
        if (isSensitive && typeof value === 'string' && value.length > 0) {
          sanitized[key] = value.length > 6 ? `${value.substring(0, 3)}***` : '***';
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level > this.level) return;
    
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const sanitizedData = data ? this.sanitize(data) : undefined;
    const dataStr = sanitizedData ? ` ${JSON.stringify(sanitizedData)}` : '';
    
    const logMessage = `[${timestamp}] ${levelName}: ${message}${dataStr}`;
    
    switch (level) {
      case LogLevel.ERROR: console.error(logMessage); break;
      case LogLevel.WARN: console.warn(logMessage); break;
      case LogLevel.INFO: console.info(logMessage); break;
      case LogLevel.DEBUG: console.debug(logMessage); break;
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log authentication attempt (sanitized)
   */
  logAuth(email: string, success: boolean): void {
    const sanitizedEmail = email.includes('@') 
      ? `${email.split('@')[0]?.substring(0, 3)}***@${email.split('@')[1]}`
      : '***';
    
    this.info(`Authentication ${success ? 'successful' : 'failed'}`, { 
      email: sanitizedEmail, 
      success 
    });
  }

  /**
   * Log API call
   */
  logApiCall(method: string, url: string, status?: number, duration?: number): void {
    this.info(`API ${method.toUpperCase()} ${url}`, { 
      method, 
      url, 
      status, 
      duration: duration ? `${duration}ms` : undefined 
    });
  }
}

// =============================================================================
// HTTP CLIENT 
// =============================================================================

export class HttpClient {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Execute HTTP request with basic retries
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'request'
  ): Promise<T> {
    let lastError: any;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const start = Date.now();
        const result = await operation();
        const duration = Date.now() - start;
        
        if (attempt > 0) {
          this.logger.info(`${context} succeeded after ${attempt} retries`, { duration });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt or non-retryable errors
        if (attempt === maxRetries || !this.isRetryable(error)) {
          break;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
        this.logger.warn(`${context} failed, retrying in ${delay}ms`, { 
          attempt: attempt + 1, 
          error: error instanceof Error ? error.message : String(error) 
        });
        
        await this.sleep(delay);
      }
    }
    
    this.logger.error(`${context} failed after all retries`, { error: lastError });
    throw lastError;
  }

  private isRetryable(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Server errors (5xx) and rate limits (429)
    if (error.response?.status >= 500 || error.response?.status === 429) {
      return true;
    }
    
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create singleton instances
export const logger = new Logger();
export const httpClient = new HttpClient();