#!/bin/bash
# MDA System Deployment Script

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