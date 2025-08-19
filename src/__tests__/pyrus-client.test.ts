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
});