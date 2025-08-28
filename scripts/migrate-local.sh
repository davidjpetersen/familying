#!/bin/bash

# Local Migration Runner for Familying Project
# This script helps run migrations locally with proper environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env.local"

# Help function
show_help() {
    cat << EOF
🚀 Local Migration Runner for Familying Project

Usage: $0 [options]

Options:
    --help, -h          Show this help message
    --dry-run           Show what migrations would be executed without running them
    --env-file FILE     Use custom environment file (default: .env.local)
    --reset             Reset all migrations (dangerous - use with caution)
    --plugin PLUGIN     Run migrations for specific plugin only
    --global            Run global migrations only

Environment:
    The script will automatically load environment variables from .env.local
    
    Required variables:
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY

Examples:
    $0                                  # Run all pending migrations
    $0 --dry-run                       # Show what would be executed
    $0 --plugin soundscapes            # Run only soundscapes plugin migrations
    $0 --global                        # Run only global migrations
    $0 --env-file .env.development     # Use custom env file

EOF
}

# Parse command line arguments
DRY_RUN=false
RESET=false
PLUGIN=""
GLOBAL_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --reset)
            RESET=true
            shift
            ;;
        --plugin)
            PLUGIN="$2"
            shift 2
            ;;
        --global)
            GLOBAL_ONLY=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Load environment variables
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        print_info "Loading environment from $ENV_FILE"
        set -a  # Automatically export all variables
        source "$ENV_FILE"
        set +a
    else
        print_warning "Environment file $ENV_FILE not found"
        print_info "You can create it or specify a custom file with --env-file"
        print_info "Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
        exit 1
    fi
}

# Validate required environment variables
validate_env() {
    local missing_vars=()
    
    if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]; then
        missing_vars+=("NEXT_PUBLIC_SUPABASE_URL")
    fi
    
    if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Reset migrations (dangerous operation)
reset_migrations() {
    if [[ "$RESET" == "true" ]]; then
        print_warning "DANGER: This will reset all migration tracking!"
        print_warning "The actual database schema will NOT be reverted."
        print_warning "Only the migration tracking tables will be cleared."
        
        read -p "Are you sure you want to continue? (type 'RESET' to confirm): " confirmation
        
        if [[ "$confirmation" != "RESET" ]]; then
            print_info "Reset cancelled"
            exit 0
        fi
        
        print_info "Resetting migration tracking..."
        
        # Use node to reset the tracking tables
        node -e "
        import { createClient } from '@supabase/supabase-js';
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        async function reset() {
          try {
            const { error: error1 } = await supabase.from('migrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error: error2 } = await supabase.from('plugin_migrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (error1) console.error('Error clearing migrations:', error1);
            if (error2) console.error('Error clearing plugin_migrations:', error2);
            
            console.log('✅ Migration tracking reset complete');
          } catch (error) {
            console.error('❌ Reset failed:', error);
            process.exit(1);
          }
        }
        
        reset();
        "
        
        print_success "Migration tracking reset complete"
    fi
}

# Run the migration script with appropriate options
run_migrations() {
    local migration_args=()
    
    if [[ "$DRY_RUN" == "true" ]]; then
        migration_args+=("--dry-run")
        print_info "Running in dry-run mode (no actual migrations will be executed)"
    fi
    
    # Set CI_FAIL_FAST to false for local development (more forgiving)
    export CI_FAIL_FAST="false"
    
    print_info "Starting migration process..."
    print_info "Project root: $PROJECT_ROOT"
    
    cd "$PROJECT_ROOT"
    
    # Run the main migration script
    node scripts/migrate.mjs "${migration_args[@]}"
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        print_success "Migration process completed successfully"
    else
        print_error "Migration process failed with exit code $exit_code"
        exit $exit_code
    fi
}

# Check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        print_info "Please install Node.js to run migrations"
        exit 1
    fi
    
    local node_version=$(node --version)
    print_info "Using Node.js version: $node_version"
}

# Main execution
main() {
    print_info "🚀 Familying Local Migration Runner"
    print_info "================================="
    
    check_node
    load_env
    validate_env
    reset_migrations
    run_migrations
    
    print_success "All operations completed successfully!"
}

# Run main function
main "$@"
