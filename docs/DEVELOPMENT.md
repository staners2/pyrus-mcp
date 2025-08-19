# Development Guide

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/staners2/pyrus-mcp.git
cd pyrus-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
export PYRUS_LOGIN="your-email@domain.com"
export PYRUS_API_TOKEN="your-security-key-here"
export PYRUS_DOMAIN="pyrus.com"  # optional
```

### Development Commands

```bash
npm run dev        # Start development server with ts-node
npm run build      # Build TypeScript to JavaScript
npm run start      # Start compiled server
npm run clean      # Clean build artifacts
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main MCP server implementation
│   ├── pyrus-client.ts   # Pyrus API client
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript output
├── docs/                 # Documentation
├── .github/workflows/    # GitHub Actions
├── package.json
├── tsconfig.json
└── README.md
```

## MCP Configuration for Development

### With Claude Code

```bash
claude mcp add pyrus-dev node "./dist/index.js" \
  --env PYRUS_LOGIN="your-email@domain.com" \
  --env PYRUS_API_TOKEN="your-security-key-here" \
  --scope user
```

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pyrus-dev": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "PYRUS_LOGIN": "your-email@domain.com",
        "PYRUS_API_TOKEN": "your-security-key-here"
      }
    }
  }
}
```

## Testing

Test the server standalone:

```bash
npm run build
npm start
```

The server will connect via stdio and log initialization messages.

## Code Style

- TypeScript with strict mode enabled
- ESLint configuration follows standard practices  
- All functions should have proper type annotations
- Error handling should use MCP error types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and test locally
5. Submit a pull request

## Debugging

Enable debug logging by setting:

```bash
export DEBUG=pyrus-mcp:*
```

The server logs important events to stderr, which will be visible in Claude's logs.