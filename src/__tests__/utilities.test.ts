import { Logger, HttpClient } from '../utilities';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set LOG_LEVEL to DEBUG to see all logs in tests
    process.env.LOG_LEVEL = 'DEBUG';
    logger = new Logger();
    consoleLogSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log info messages', () => {
    logger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('INFO: Test message'));
  });

  test('should log error messages', () => {
    logger.error('Error message');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR: Error message'));
  });

  test('should sanitize sensitive data', () => {
    logger.info('User data', { password: 'secret123', username: 'testuser' });
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('username');
    expect(logCall).not.toContain('secret123');
    expect(logCall).toContain('***');
  });
});

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient();
  });

  test('should execute operations successfully', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await httpClient.execute(mockOperation, 'test');
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  test('should retry on retryable errors', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValue('success');
    
    const result = await httpClient.execute(mockOperation, 'test');
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  test('should not retry on non-retryable errors', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValue({ response: { status: 400 } });
    
    await expect(httpClient.execute(mockOperation, 'test'))
      .rejects.toEqual({ response: { status: 400 } });
    
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });
});