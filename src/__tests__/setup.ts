/**
 * Test setup file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'ERROR'; // Reduce noise in tests

// Basic test
describe('Test Environment', () => {
  test('should be configured for testing', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});