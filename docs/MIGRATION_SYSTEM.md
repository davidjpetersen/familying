# Migration System Documentation

## Overview

The Familying project uses a comprehensive migration system that handles both global database migrations and plugin-specific migrations. This system ensures consistent database schema evolution across development, staging, and production environments.

## Architecture

### Migration Types

1. **Global Migrations**: Located in `/sql/` directory
   - Core application schema changes
   - System-wide tables and functions
   - Executed first, in alphabetical order

2. **Plugin Migrations**: Located in `/packages/services/[plugin-name]/migrations/`
   - Plugin-specific schema changes
   - Isolated to plugin functionality
   - Executed after global migrations

### Migration Tracking

The system uses two tables for migration tracking:

- `migrations`: New unified tracking table (recommended)
- `plugin_migrations`: Legacy plugin tracking (backward compatibility)

## Files Structure

```
familying/
├── scripts/
│   ├── migrate.mjs           # Main migration runner
│   └── migrate-local.sh      # Local development helper
├── .github/workflows/
│   └── ci-cd.yml            # CI/CD pipeline with auto-migrations
├── sql/                     # Global migrations
│   └── *.sql
└── packages/services/       # Plugin migrations
    └── [plugin-name]/
        └── migrations/
            └── *.sql
```

## Usage

### Local Development

Use the local helper script for development:

```bash
# Run all pending migrations
./scripts/migrate-local.sh

# Dry run to see what would be executed
./scripts/migrate-local.sh --dry-run

# Run migrations for specific plugin only
./scripts/migrate-local.sh --plugin soundscapes

# Run only global migrations
./scripts/migrate-local.sh --global

# Reset migration tracking (dangerous!)
./scripts/migrate-local.sh --reset

# Use custom environment file
./scripts/migrate-local.sh --env-file .env.development
```

### Direct Script Usage

You can also run the migration script directly:

```bash
# Run all migrations
node scripts/migrate.mjs

# Dry run
node scripts/migrate.mjs --dry-run

# With environment variables
NEXT_PUBLIC_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/migrate.mjs
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On Pull Requests**: Runs tests only
2. **On `develop` branch**: Deploys to staging environment
3. **On `main` branch**: Deploys to production environment
4. **Manual Trigger**: Allows custom deployment with options

#### Manual Workflow Dispatch

You can manually trigger migrations via GitHub Actions:

1. Go to Actions tab in GitHub
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Choose options:
   - **Environment**: staging or production
   - **Dry Run**: Preview changes without executing
   - **Fail Fast**: Stop on first error (recommended for production)

## Environment Setup

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Configuration
CI_FAIL_FAST=true  # Stop on first migration failure (default: true)
```

### Local Environment Files

Create `.env.local` in project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-local-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

## Migration Naming Convention

### Global Migrations

Use descriptive names with optional numbering:

```
sql/
├── 001_create_users_table.sql
├── 002_add_user_profiles.sql
├── create_admins_table.sql
└── add_rbac_system.sql
```

### Plugin Migrations

Include version numbers for clear ordering:

```
packages/services/soundscapes/migrations/
├── 0001_create_soundscapes_table.sql
├── 0002_create_storage_bucket.sql
└── 0003_add_audio_metadata.sql
```

## Writing Migrations

### Best Practices

1. **Idempotent**: Use `IF NOT EXISTS` where possible
2. **Atomic**: One conceptual change per migration
3. **Rollback Safe**: Avoid destructive operations
4. **Documented**: Include comments explaining changes

### Example Global Migration

```sql
-- sql/003_add_user_sessions.sql

-- Create user sessions table for enhanced auth tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

### Example Plugin Migration

```sql
-- packages/services/soundscapes/migrations/0003_add_audio_metadata.sql

-- Add metadata columns to soundscapes table
ALTER TABLE soundscapes 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS audio_format TEXT DEFAULT 'mp3',
ADD COLUMN IF NOT EXISTS sample_rate INTEGER DEFAULT 44100;

-- Create index for searching by duration
CREATE INDEX IF NOT EXISTS idx_soundscapes_duration ON soundscapes(duration_seconds);

-- Add check constraint for reasonable values
ALTER TABLE soundscapes 
ADD CONSTRAINT IF NOT EXISTS check_duration_positive 
CHECK (duration_seconds IS NULL OR duration_seconds > 0);

ALTER TABLE soundscapes 
ADD CONSTRAINT IF NOT EXISTS check_file_size_positive 
CHECK (file_size_bytes IS NULL OR file_size_bytes > 0);
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` has admin privileges
   - Check database connection

2. **Migration Already Executed**
   - Migrations are tracked and skipped automatically
   - Use `--dry-run` to verify state

3. **SQL Syntax Errors**
   - Test migrations locally first
   - Use PostgreSQL-compatible SQL

4. **Environment Variables Missing**
   - Verify `.env.local` file exists
   - Check GitHub Secrets for CI/CD

### Debug Commands

```bash
# Check what migrations would run
./scripts/migrate-local.sh --dry-run

# Reset tracking (be careful!)
./scripts/migrate-local.sh --reset

# Run with debug output
DEBUG=1 ./scripts/migrate-local.sh

# Check database connection
node -e "
import { createClient } from '@supabase/supabase-js';
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('migrations').select('count').then(console.log);
"
```

### Recovery Procedures

If migrations fail in production:

1. **Immediate Response**
   - Check GitHub Actions logs
   - Verify database state with dry-run
   - Rollback application if needed

2. **Investigation**
   - Identify failed migration
   - Check error messages
   - Verify data integrity

3. **Resolution**
   - Fix migration SQL
   - Test locally
   - Re-deploy with fixed migration

## Security Considerations

1. **Service Role Key**: Keep secure, rotate regularly
2. **Migration Content**: Review for security implications
3. **Rollback Plan**: Have recovery procedures ready
4. **Access Control**: Limit who can trigger production migrations

## Plugin Development

When creating new plugins with migrations:

1. **Use Plugin Generator**:
   ```bash
   npm run create:plugin
   ```

2. **Follow Naming Convention**:
   - Use numbered migration files
   - Include descriptive names
   - Add plugin prefix for tracking

3. **Test Thoroughly**:
   - Test migrations locally
   - Verify in staging environment
   - Include rollback considerations

## Monitoring and Alerts

The system provides:

- ✅ Success/failure logging
- 📊 Migration execution summary
- ⏱️ Performance timing
- 🔍 Dry-run capability
- 📈 Progress tracking

Consider setting up alerts for:
- Migration failures in production
- Long-running migrations
- Unexpected schema changes

## Contributing

When adding new migrations:

1. Create descriptive migration files
2. Test locally with dry-run
3. Verify in staging environment
4. Include rollback considerations
5. Update documentation if needed

For questions or issues, please refer to the project's GitHub Issues or contact the development team.
