# Pyrus MCP Server

MCP server for integrating with Pyrus task management system API. This server provides tools to create, read, update, and manage tasks in Pyrus through the Model Context Protocol.

## Quick Start

### Installation

Install from npm:

```bash
npm install -g pyrus-mcp
```

### Configuration

Set up your Pyrus API credentials:

```bash
export PYRUS_LOGIN="your-email@domain.com"
export PYRUS_API_TOKEN="your-security-key-here"
```

### Usage with Claude

Add to your Claude configuration:

```bash
claude mcp add pyrus npx pyrus-mcp \
  --env PYRUS_LOGIN="your-email@domain.com" \
  --env PYRUS_API_TOKEN="your-security-key-here" \
  --scope user
```

## Features

- **create_task**: Create new tasks in Pyrus
- **get_task**: Retrieve task details by ID  
- **update_task**: Update existing tasks (comments, status changes, assignments)
- **move_task**: Move tasks between different lists/columns
- **get_profile**: Get current user profile information

## Documentation

- [Publishing Guide](docs/PUBLISHING.md) - Instructions for publishing to npm
- [Development Setup](docs/DEVELOPMENT.md) - Local development instructions
- [API Reference](docs/API.md) - Detailed API documentation

## Getting Pyrus API Credentials

1. Log in to your Pyrus account
2. Go to Settings → Integrations → API
3. Generate a new security key
4. Use your email as `PYRUS_LOGIN` and the security key as `PYRUS_API_TOKEN`

## License

MIT