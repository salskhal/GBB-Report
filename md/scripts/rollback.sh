#!/bin/bash
# MDA System Rollback Script

set -e

BACKUP_DIR="/opt/backups"
DEPLOY_DIR="/opt/mda-system"
SERVICE_NAME="mda-system"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# List available backups
list_backups() {
    echo "Available backups:"
    ls -la $BACKUP_DIR/app-backup-*.tar.gz 2>/dev/null || echo "No application backups found"
    ls -la $BACKUP_DIR/pre-migration-* 2>/dev/null || echo "No database backups found"
}

# Rollback application
rollback_application() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Stopping service..."
    sudo systemctl stop $SERVICE_NAME
    
    log "Backing up current version..."
    tar -czf "$BACKUP_DIR/current-backup-$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DEPLOY_DIR" .
    
    log "Restoring from backup: $backup_file"
    rm -rf $DEPLOY_DIR/*
    tar -xzf "$backup_file" -C "$DEPLOY_DIR"
    
    log "Installing dependencies..."
    cd $DEPLOY_DIR
    npm ci --production
    
    log "Starting service..."
    sudo systemctl start $SERVICE_NAME
    
    # Wait and verify
    sleep 5
    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        log "Rollback completed successfully"
    else
        error "Service failed to start after rollback"
    fi
}

# Rollback database
rollback_database() {
    local backup_dir=$1
    
    if [ ! -d "$backup_dir" ]; then
        error "Database backup directory not found: $backup_dir"
    fi
    
    log "Stopping service..."
    sudo systemctl stop $SERVICE_NAME
    
    log "Creating current database backup..."
    mongodump --host localhost:27017 --db mda_system --out "$BACKUP_DIR/current-db-backup-$(date +%Y%m%d_%H%M%S)"
    
    log "Dropping current database..."
    mongosh mda_system --eval "db.dropDatabase()"
    
    log "Restoring database from backup..."
    mongorestore --host localhost:27017 --db mda_system "$backup_dir/mda_system"
    
    log "Starting service..."
    sudo systemctl start $SERVICE_NAME
    
    log "Database rollback completed"
}

# Main rollback function
main() {
    case "$1" in
        "list")
            list_backups
            ;;
        "app")
            if [ -z "$2" ]; then
                error "Please specify backup file"
            fi
            rollback_application "$2"
            ;;
        "db")
            if [ -z "$2" ]; then
                error "Please specify backup directory"
            fi
            rollback_database "$2"
            ;;
        "full")
            if [ -z "$2" ] || [ -z "$3" ]; then
                error "Please specify both app backup file and db backup directory"
            fi
            rollback_database "$3"
            rollback_application "$2"
            ;;
        *)
            echo "Usage: $0 {list|app|db|full} [backup_file] [db_backup_dir]"
            echo ""
            echo "Commands:"
            echo "  list                    - List available backups"
            echo "  app <backup_file>       - Rollback application only"
            echo "  db <backup_dir>         - Rollback database only"
            echo "  full <app_backup> <db_backup> - Rollback both app and database"
            exit 1
            ;;
    esac
}

main "$@"