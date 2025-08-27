# Book Summaries

Enhanced book summaries of parenting classics

## Installation

This plugin is automatically discovered when placed in the `packages/services` directory.

## Configuration

The plugin accepts the following configuration options:

- `FEATURE_ENABLED`: Enable/disable the plugin (default: true)
- `LIMIT`: Maximum number of items (default: 100)

Set these via environment variables:
```bash
SUMMARIES_FEATURE_ENABLED=true
SUMMARIES_LIMIT=100
```

## Routes

### User Routes

- `GET /app/summaries`: List items
- `GET /app/summaries/:id`: Get item by ID  
- `POST /app/summaries`: Create new item

### Admin Routes

- `GET /admin/summaries`: Admin dashboard
- `GET /admin/summaries/settings`: Plugin settings
- `POST /admin/summaries/settings`: Update settings

## Database Schema

The plugin creates the following tables:

- `summaries_items`: Main data table

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Migration

The plugin includes database migrations in the `migrations/` directory. These are automatically run when the plugin is loaded.

## Author

David Petersen
