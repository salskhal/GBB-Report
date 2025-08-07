# MDA System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the enhanced MDA reporting system with username-based authentication, multi-report support, hierarchical admin management, and activity logging.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration](#database-migration)
3. [Application Deployment](#application-deployment)
4. [Monitoring Setup](#monitoring-setup)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Performance Monitoring](#performance-monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### System Requirements

#### Server Requirements
- **Node.js**: Version 18.x or higher
- **MongoDB**: Version 5.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection for report URLs

#### Environment Setup
- [ ] Production environment configured
- [ ] Staging environment available for testing
- [ ] Database backup completed
- [ ] SSL certificates installed and valid
- [ ] Environment variables configured
- [ ] Firewall rules updated for new endpoints

### Pre-Migration Backup

```bash
# Create full database backup
mongodump --host localhost:27017 --db mda_system --out ./backup/pre-migration-$(date +%Y%m%d_%H%M%S)

# Create application backup
tar -czf ./backup/app-backup-$(date +%Y%m%d_%H%M%S).tar.gz /path/to/current/application

# Verify backup integrity
mongorestore --dry-run --host localhost:27017 --db mda_system_test ./backup/pre-migration-*/mda_system
```

### Dependencies Check

```bash
# Verify Node.js version
node --version  # Should be 18.x or higher

# Verify MongoDB version
mongod --version  # Should be 5.0 or higher

# Check available disk space
df -h

# Verify network connectivity to report URLs
# (Test sample report URLs from your environment)
```

---

## Database Migration

### Migration Scripts Overview

The system includes three main migration scripts:
1. **User Collection Migration**: Username-based authentication
2. **MDA Collection Migration**: Multi-report support
3. **Admin Collection Migration**: Hierarchical admin roles

### Running Migrations

#### Step 1: Prepare Migration Environment

```bash
# Navigate to server directory
cd Server

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://localhost:27017/mda_system
export JWT_SECRET=your-production-jwt-secret

# Verify database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection failed:', err));
"
```

#### Step 2: Run Migration Scripts

```bash
# Run migrations in order
node src/migrations/migrationRunner.js

# Or run individual migrations
node src/migrations/001_migrate_user_collection.js
node src/migrations/002_migrate_mda_collection.js
node src/migrations/003_migrate_admin_collection.js
```

#### Step 3: Verify Migration Results

```bash
# Check migration status
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

// Verify user collection structure
db.collection('users').findOne().then(user => {
  console.log('Sample user:', user);
  console.log('Has username:', !!user.username);
  console.log('Has contactEmail:', !!user.contactEmail);
});

// Verify MDA collection structure
db.collection('mdas').findOne().then(mda => {
  console.log('Sample MDA:', mda);
  console.log('Has reports array:', Array.isArray(mda.reports));
});

// Verify admin collection structure
db.collection('admins').findOne().then(admin => {
  console.log('Sample admin:', admin);
  console.log('Has canBeDeleted field:', admin.hasOwnProperty('canBeDeleted'));
});
"
```

### Migration Validation

```bash
# Create validation script
cat > validate_migration.js << 'EOF'
const mongoose = require('mongoose');

async function validateMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Validate users
    const userCount = await db.collection('users').countDocuments();
    const usersWithUsername = await db.collection('users').countDocuments({ username: { $exists: true } });
    const usersWithContactEmail = await db.collection('users').countDocuments({ contactEmail: { $exists: true } });
    
    console.log(`Users: ${userCount}, With username: ${usersWithUsername}, With contactEmail: ${usersWithContactEmail}`);
    
    // Validate MDAs
    const mdaCount = await db.collection('mdas').countDocuments();
    const mdasWithReports = await db.collection('mdas').countDocuments({ reports: { $exists: true, $type: 'array' } });
    
    console.log(`MDAs: ${mdaCount}, With reports array: ${mdasWithReports}`);
    
    // Validate admins
    const adminCount = await db.collection('admins').countDocuments();
    const adminsWithCanBeDeleted = await db.collection('admins').countDocuments({ canBeDeleted: { $exists: true } });
    
    console.log(`Admins: ${adminCount}, With canBeDeleted: ${adminsWithCanBeDeleted}`);
    
    console.log('Migration validation completed successfully');
  } catch (error) {
    console.error('Migration validation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

validateMigration();
EOF

# Run validation
node validate_migration.js
```

---

## Application Deployment

### Deployment Script

```bash
#!/bin/bash
# deploy.sh - MDA System Deployment Script

set -e  # Exit on any error

# Configuration
APP_NAME="mda-system"
DEPLOY_DIR="/opt/mda-system"
BACKUP_DIR="/opt/backups"
SERVICE_NAME="mda-system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
log "Starting MDA System deployment..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check system requirements
log "Checking system requirements..."
node --version || error "Node.js not found"
mongod --version || error "MongoDB not found"

# Check available disk space (minimum 5GB)
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [ $AVAILABLE_SPACE -lt 5242880 ]; then
    error "Insufficient disk space. At least 5GB required."
fi

# Create backup
log "Creating application backup..."
mkdir -p $BACKUP_DIR
if [ -d "$DEPLOY_DIR" ]; then
    tar -czf "$BACKUP_DIR/app-backup-$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DEPLOY_DIR" .
    log "Application backup created"
fi

# Stop existing service
log "Stopping existing service..."
sudo systemctl stop $SERVICE_NAME || warn "Service not running"

# Deploy new version
log "Deploying new application version..."
mkdir -p $DEPLOY_DIR
cp -r ./Server/* $DEPLOY_DIR/
cp -r ./Client/dist $DEPLOY_DIR/public

# Install dependencies
log "Installing server dependencies..."
cd $DEPLOY_DIR
npm ci --production

# Build client (if not already built)
if [ ! -d "$DEPLOY_DIR/public" ]; then
    log "Building client application..."
    cd ../Client
    npm ci
    npm run build
    cp -r ./dist $DEPLOY_DIR/public
fi

# Set permissions
log "Setting file permissions..."
chown -R $USER:$USER $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR

# Update environment configuration
log "Updating environment configuration..."
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env
    warn "Please update .env file with production values"
fi

# Run database migrations
log "Running database migrations..."
cd $DEPLOY_DIR
NODE_ENV=production node src/migrations/migrationRunner.js

# Create/update systemd service
log "Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=MDA Reporting System
After=network.target mongod.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
log "Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Wait for service to start
sleep 5

# Verify deployment
log "Verifying deployment..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    log "Service is running"
else
    error "Service failed to start"
fi

# Health check
log "Performing health check..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log "Health check passed"
else
    error "Health check failed"
fi

log "Deployment completed successfully!"
log "Application is running at http://localhost:5000"
log "Admin panel: http://localhost:5000/admin"

# Display next steps
echo ""
echo "Next steps:"
echo "1. Update .env file with production values"
echo "2. Configure SSL/TLS certificates"
echo "3. Set up monitoring and logging"
echo "4. Test all functionality"
echo "5. Update DNS records if needed"
```

### Environment Configuration

```bash
# Create production environment file
cat > .env.production << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mda_system
DB_NAME=mda_system

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-change-this
SESSION_TIMEOUT=3600000

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/mda-system/app.log

# Activity Log Configuration
ACTIVITY_LOG_RETENTION_DAYS=365
ACTIVITY_LOG_CLEANUP_INTERVAL=86400000

# Email Configuration (if needed)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

# Monitoring Configuration
HEALTH_CHECK_ENDPOINT=/api/health
METRICS_ENDPOINT=/api/metrics
EOF
```

### SSL/TLS Configuration

```bash
# Install SSL certificate (using Let's Encrypt example)
sudo apt install certbot nginx

# Configure Nginx reverse proxy
sudo tee /etc/nginx/sites-available/mda-system << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/mda-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Monitoring Setup

### Application Monitoring

```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
# MDA System Monitoring Script

SERVICE_NAME="mda-system"
LOG_FILE="/var/log/mda-system/monitor.log"
ALERT_EMAIL="admin@yourdomain.com"

log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

check_service() {
    if ! systemctl is-active --quiet $SERVICE_NAME; then
        log_message "ERROR: Service $SERVICE_NAME is not running"
        systemctl start $SERVICE_NAME
        log_message "INFO: Attempted to restart $SERVICE_NAME"
        return 1
    fi
    return 0
}

check_database() {
    if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_message "ERROR: MongoDB is not responding"
        return 1
    fi
    return 0
}

check_disk_space() {
    USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 85 ]; then
        log_message "WARNING: Disk usage is ${USAGE}%"
        return 1
    fi
    return 0
}

check_memory() {
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -gt 90 ]; then
        log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
        return 1
    fi
    return 0
}

check_api_health() {
    if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log_message "ERROR: API health check failed"
        return 1
    fi
    return 0
}

# Run all checks
ERRORS=0

check_service || ((ERRORS++))
check_database || ((ERRORS++))
check_disk_space || ((ERRORS++))
check_memory || ((ERRORS++))
check_api_health || ((ERRORS++))

if [ $ERRORS -eq 0 ]; then
    log_message "INFO: All checks passed"
else
    log_message "WARNING: $ERRORS checks failed"
fi

exit $ERRORS
EOF

chmod +x monitor.sh

# Set up cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/monitor.sh") | crontab -
```

### Log Rotation Setup

```bash
# Configure log rotation
sudo tee /etc/logrotate.d/mda-system << 'EOF'
/var/log/mda-system/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mda-user mda-user
    postrotate
        systemctl reload mda-system
    endscript
}
EOF
```

### Performance Monitoring

```javascript
// Create performance monitoring endpoint
// Add to Server/src/routes/monitoring.js

import express from 'express';
import os from 'os';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    // Check uptime
    const uptime = process.uptime();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      database: {
        status: dbStatus,
        readyState: dbState
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        system: {
          total: Math.round(totalMem / 1024 / 1024),
          free: Math.round(freeMem / 1024 / 1024)
        }
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Admin = mongoose.model('Admin');
    const MDA = mongoose.model('MDA');
    const Activity = mongoose.model('Activity');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        inactive: await User.countDocuments({ isActive: false })
      },
      admins: {
        total: await Admin.countDocuments(),
        superAdmins: await Admin.countDocuments({ role: 'superadmin' }),
        admins: await Admin.countDocuments({ role: 'admin' })
      },
      mdas: {
        total: await MDA.countDocuments(),
        active: await MDA.countDocuments({ isActive: true })
      },
      activities: {
        total: await Activity.countDocuments(),
        today: await Activity.countDocuments({
          timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        thisWeek: await Activity.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      }
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

---

## Rollback Procedures

### Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh - MDA System Rollback Script

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
```

### Emergency Procedures

```bash
# Create emergency response script
cat > emergency_response.sh << 'EOF'
#!/bin/bash
# Emergency Response Script for MDA System

SERVICE_NAME="mda-system"
BACKUP_DIR="/opt/backups"

# Immediate service stop
emergency_stop() {
    echo "EMERGENCY: Stopping all services..."
    sudo systemctl stop $SERVICE_NAME
    sudo systemctl stop nginx
    echo "Services stopped"
}

# Quick health check
quick_health_check() {
    echo "Performing quick health check..."
    
    # Check service status
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo "✓ Service is running"
    else
        echo "✗ Service is not running"
    fi
    
    # Check database
    if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✓ Database is responding"
    else
        echo "✗ Database is not responding"
    fi
    
    # Check API
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✓ API is responding"
    else
        echo "✗ API is not responding"
    fi
}

# Create emergency backup
emergency_backup() {
    echo "Creating emergency backup..."
    mkdir -p $BACKUP_DIR/emergency
    
    # Backup database
    mongodump --host localhost:27017 --db mda_system --out "$BACKUP_DIR/emergency/db-$(date +%Y%m%d_%H%M%S)"
    
    # Backup application
    tar -czf "$BACKUP_DIR/emergency/app-$(date +%Y%m%d_%H%M%S).tar.gz" -C "/opt/mda-system" .
    
    echo "Emergency backup completed"
}

case "$1" in
    "stop")
        emergency_stop
        ;;
    "check")
        quick_health_check
        ;;
    "backup")
        emergency_backup
        ;;
    "all")
        emergency_backup
        emergency_stop
        ;;
    *)
        echo "Emergency Response Commands:"
        echo "  stop    - Immediately stop all services"
        echo "  check   - Quick health check"
        echo "  backup  - Create emergency backup"
        echo "  all     - Backup then stop services"
        ;;
esac
EOF

chmod +x emergency_response.sh
```

---

## Post-Deployment Verification

### Verification Checklist

```bash
#!/bin/bash
# Post-deployment verification script

echo "MDA System Post-Deployment Verification"
echo "======================================="

ERRORS=0

# Test 1: Service Status
echo -n "1. Checking service status... "
if systemctl is-active --quiet mda-system; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 2: Database Connection
echo -n "2. Checking database connection... "
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 3: API Health Check
echo -n "3. Checking API health... "
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 4: User Login
echo -n "4. Testing user authentication... "
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test-user","password":"wrongpassword"}')
if echo "$RESPONSE" | grep -q "success.*false"; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 5: Admin Login
echo -n "5. Testing admin authentication... "
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@admin.com","password":"wrongpassword"}')
if echo "$RESPONSE" | grep -q "success.*false"; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 6: Database Migration Verification
echo -n "6. Verifying database migration... "
USER_COUNT=$(mongosh mda_system --quiet --eval "db.users.countDocuments({username: {\$exists: true}})")
MDA_COUNT=$(mongosh mda_system --quiet --eval "db.mdas.countDocuments({reports: {\$exists: true, \$type: 'array'}})")
if [ "$USER_COUNT" -gt 0 ] && [ "$MDA_COUNT" -gt 0 ]; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    ((ERRORS++))
fi

# Test 7: SSL Certificate (if configured)
echo -n "7. Checking SSL certificate... "
if curl -f https://yourdomain.com > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "⚠ SKIP (SSL not configured or domain not accessible)"
fi

# Summary
echo ""
echo "Verification Summary:"
echo "===================="
if [ $ERRORS -eq 0 ]; then
    echo "✓ All tests passed! Deployment successful."
    exit 0
else
    echo "✗ $ERRORS test(s) failed. Please review and fix issues."
    exit 1
fi
```

### Manual Testing Checklist

- [ ] **User Authentication**
  - [ ] User can log in with username and password
  - [ ] Invalid credentials are rejected
  - [ ] User is redirected to dashboard after login
  - [ ] User can log out successfully

- [ ] **Multi-Report Functionality**
  - [ ] Users see report selection interface (if multiple reports)
  - [ ] Users can switch between reports
  - [ ] Reports load correctly in iframe
  - [ ] Report selection is remembered during session

- [ ] **Admin Functions**
  - [ ] Admin can log in with email and password
  - [ ] Admin can create, update, and delete users
  - [ ] Admin can create, update, and delete MDAs
  - [ ] Admin can manage multiple reports per MDA

- [ ] **Super Admin Functions**
  - [ ] Super admin can manage other admin accounts
  - [ ] Super admin can view activity logs
  - [ ] Super admin can export activity logs
  - [ ] Super admin cannot be deleted

- [ ] **System Performance**
  - [ ] Page load times are acceptable
  - [ ] Reports load within reasonable time
  - [ ] Database queries perform well
  - [ ] No memory leaks observed

---

## Performance Monitoring

### Key Performance Indicators

Monitor these metrics continuously:

1. **Response Times**
   - API endpoint response times
   - Report loading times
   - Database query performance

2. **System Resources**
   - CPU usage
   - Memory consumption
   - Disk space utilization
   - Network bandwidth

3. **Application Metrics**
   - Active user sessions
   - Failed login attempts
   - Error rates
   - Database connection pool usage

4. **Business Metrics**
   - User login frequency
   - Report access patterns
   - Admin activity levels
   - System availability

### Monitoring Tools Setup

```bash
# Install monitoring tools
npm install --save express-prometheus-middleware prom-client

# Add to your Express app
import promMid from 'express-prometheus-middleware';

app.use(promMid({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
}));
```

### Alert Configuration

```bash
# Create alerting script
cat > alerts.sh << 'EOF'
#!/bin/bash
# Alert configuration for MDA System

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
EMAIL="admin@yourdomain.com"

send_alert() {
    local message="$1"
    local severity="$2"
    
    # Send to Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"[$severity] MDA System Alert: $message\"}" \
        $WEBHOOK_URL
    
    # Send email
    echo "$message" | mail -s "[$severity] MDA System Alert" $EMAIL
}

# Check for high error rates
ERROR_RATE=$(tail -1000 /var/log/mda-system/app.log | grep -c "ERROR")
if [ $ERROR_RATE -gt 10 ]; then
    send_alert "High error rate detected: $ERROR_RATE errors in last 1000 log entries" "WARNING"
fi

# Check for failed logins
FAILED_LOGINS=$(tail -1000 /var/log/mda-system/app.log | grep -c "Login failed")
if [ $FAILED_LOGINS -gt 20 ]; then
    send_alert "High number of failed logins: $FAILED_LOGINS in last 1000 log entries" "WARNING"
fi
EOF

chmod +x alerts.sh

# Add to cron for regular checking
(crontab -l 2>/dev/null; echo "*/15 * * * * /path/to/alerts.sh") | crontab -
```

---

## Troubleshooting

### Common Deployment Issues

#### Service Won't Start
```bash
# Check service status
sudo systemctl status mda-system

# Check logs
sudo journalctl -u mda-system -f

# Check application logs
tail -f /var/log/mda-system/app.log

# Common fixes:
# 1. Check environment variables
# 2. Verify database connection
# 3. Check file permissions
# 4. Verify Node.js version
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB if needed
sudo systemctl restart mongod
```

#### Migration Failures
```bash
# Check migration logs
cat /var/log/mda-system/migration.log

# Verify database state
mongosh mda_system --eval "
  db.users.findOne();
  db.mdas.findOne();
  db.admins.findOne();
"

# Rollback if necessary
./rollback.sh db /opt/backups/pre-migration-YYYYMMDD_HHMMSS
```

#### Performance Issues
```bash
# Check system resources
top
htop
iotop

# Check database performance
mongosh mda_system --eval "db.stats()"

# Check slow queries
mongosh mda_system --eval "db.setProfilingLevel(2, {slowms: 100})"

# Monitor network connections
netstat -tulpn | grep :5000
```

### Recovery Procedures

#### Complete System Recovery
1. Stop all services
2. Restore from backup
3. Verify data integrity
4. Restart services
5. Run verification tests

#### Partial Recovery
1. Identify affected components
2. Stop relevant services
3. Restore specific components
4. Restart services
5. Test functionality

---

## Conclusion

This deployment guide provides comprehensive procedures for deploying the enhanced MDA system. Follow all steps carefully and maintain regular backups. Monitor the system continuously and be prepared to execute rollback procedures if issues arise.

For additional support, refer to the troubleshooting section or contact the development team.

**Last Updated**: January 2024
**Version**: 2.0.0