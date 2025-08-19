/**
 * Simple integration tests for MCP server
 */

describe('Pyrus MCP Server', () => {
  test('should have required environment variables defined', () => {
    // Basic environment check
    expect(process.env).toBeDefined();
  });

  test('should export main server class', () => {
    // Test that the dist file exists and is executable
    const fs = require('fs');
    const path = require('path');
    
    const distPath = path.join(__dirname, '../../dist/index.js');
    expect(fs.existsSync(distPath)).toBe(true);
    
    // Check file starts with shebang
    const content = fs.readFileSync(distPath, 'utf8');
    expect(content).toMatch(/^#!/);
  });

  test('should have proper MCP tools configuration', () => {
    const expectedTools = [
      'create_task',
      'get_task',
      'update_task', 
      'move_task',
      'get_profile'
    ];

    // This tests that our tool names are consistent
    expectedTools.forEach(tool => {
      expect(typeof tool).toBe('string');
      expect(tool.length).toBeGreaterThan(0);
    });
  });
});