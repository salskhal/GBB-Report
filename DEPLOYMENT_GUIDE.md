# Deployment Guide: Ubuntu Server Setup

This guide walks you through deploying your React + Node.js application on an Ubuntu server running in UTM virtualization with domain configuration.

## Prerequisites

- Ubuntu server running in UTM (macOS virtualization)
- Domain: galaxy.gra8sal.xyz
- Basic knowledge of Linux commands
- SSH access to your Ubuntu VM

## Table of Contents

1. [Server Setup](#server-setup)
2. [Install Dependencies](#install-dependencies)
3. [Application Deployment](#application-deployment)
4. [Web Server Configuration](#web-server-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [UTM Network Configuration](#utm-network-configuration)
7. [Domain Configuration](#domain-configuration)
8. [Process Management](#process-management)
9. [Monitoring & Maintenance](#monitoring--maintenance)

## Server Setup

### 1. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Create Application User

```bash
sudo adduser appuser
sudo usermod -aG sudo appuser
su - appuser
```

### 3. Configure Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

## Install Dependencies

### 1. Install Node.js (using NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2. Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 5. Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Application Deployment

### 1. Clone Your Repository

```bash
cd /home/appuser
git clone <your-repository-url> app
cd app
```

### 2. Setup Backend

```bash
cd Server
npm install

# Create production environment file
cp .env.example .env
```

Edit the `.env` file:

```bash
nano .env
```

Configure production values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGIN=https://galaxy.gra8sal.xyz
```

### 3. Setup Frontend

```bash
cd ../Client
npm install

# Create production environment file
cp .env.example .env
```

Edit the `.env` file:

```bash
nano .env
```

Configure production values:

```env
VITE_API_URL=https://galaxy.gra8sal.xyz/api
VITE_NODE_ENV=production
```

### 4. Build Frontend

```bash
npm run build
```

## Web Server Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/galaxy.gra8sal.xyz
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name galaxy.gra8sal.xyz www.galaxy.gra8sal.xyz;

    # Frontend (React build)
    location / {
        root /home/appuser/app/Client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
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

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable Site Configuration

```bash
sudo ln -s /etc/nginx/sites-available/galaxy.gra8sal.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## UTM Network Configuration

### 1. Configure UTM Network Settings

In UTM, ensure your Ubuntu VM is configured for external access:

**Option A: Bridged Network (Recommended)**

1. Open UTM and select your Ubuntu VM
2. Go to Settings → Network
3. Change Network Mode to "Bridged (Advanced)"
4. Select your Mac's active network interface
5. Start the VM

**Option B: Port Forwarding (Alternative)**

1. Keep Network Mode as "Shared Network"
2. Add port forwarding rules:
   - Guest Port: 80 → Host Port: 8080
   - Guest Port: 443 → Host Port: 8443
   - Guest Port: 22 → Host Port: 2222

### 2. Find Your VM's IP Address

Inside your Ubuntu VM:

```bash
# For bridged network
ip addr show | grep inet

# Note the IP address (usually 192.168.x.x or similar)
```

For bridged network, use this IP in your DNS configuration.
For port forwarding, use your Mac's IP address.

### 3. Test Network Connectivity

From your Mac terminal:

```bash
# Test SSH connection
ssh appuser@VM_IP_ADDRESS

# Test HTTP connection (after setup)
curl http://VM_IP_ADDRESS
```

## SSL Certificate Setup

### 1. Obtain SSL Certificate

```bash
sudo certbot --nginx -d galaxy.gra8sal.xyz -d www.galaxy.gra8sal.xyz
```

### 2. Auto-renewal Setup

```bash
sudo crontab -e
```

Add this line:

```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## Domain Configuration

### 1. DNS Records Setup

In your domain registrar's DNS management panel for `gra8sal.xyz`, add these records:

```
Type    Name        Value                   TTL
A       galaxy      YOUR_VM_IP_ADDRESS      300
A       www.galaxy  YOUR_VM_IP_ADDRESS      300
```

### 2. Find Your VM's IP Address

**For Bridged Network:**

```bash
# Inside your Ubuntu VM
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**For Port Forwarding:**

```bash
# On your Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
# Use your Mac's IP address
```

### 3. UTM-Specific Considerations

**If using Bridged Network:**

- Your VM gets a real IP on your local network
- Domain should point directly to this IP
- Works best for local development/testing

**If using Port Forwarding:**

- Domain points to your Mac's IP
- Traffic routes through UTM to your VM
- May need router configuration for external access

**For External Access (Internet):**

- Configure your router to forward ports 80/443 to your Mac
- Or use a service like ngrok for testing:

```bash
# Install ngrok on your Mac
brew install ngrok

# Forward to your VM
ngrok http VM_IP_ADDRESS:80
```

## Process Management

### 1. Create PM2 Ecosystem File

```bash
cd /home/appuser/app
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: "report-admin-backend",
      script: "./Server/src/app.js",
      cwd: "/home/appuser/app",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

### 2. Create Logs Directory

```bash
mkdir -p /home/appuser/app/logs
```

### 3. Start Application with PM2

```bash
cd /home/appuser/app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the instructions provided by `pm2 startup` command.

### 4. PM2 Management Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Restart application
pm2 restart report-admin-backend

# Stop application
pm2 stop report-admin-backend

# Monitor resources
pm2 monit
```

## Monitoring & Maintenance

### 1. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/pm2-appuser
```

Add:

```
/home/appuser/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 appuser appuser
    postrotate
        sudo -u appuser pm2 reloadLogs
    endscript
}
```

### 2. System Monitoring Script

Create a monitoring script:

```bash
nano /home/appuser/monitor.sh
```

```bash
#!/bin/bash
# Basic system monitoring

echo "=== System Status $(date) ==="
echo "Disk Usage:"
df -h

echo -e "\nMemory Usage:"
free -h

echo -e "\nCPU Usage:"
top -bn1 | grep "Cpu(s)"

echo -e "\nNginx Status:"
sudo systemctl is-active nginx

echo -e "\nMongoDB Status:"
sudo systemctl is-active mongod

echo -e "\nPM2 Status:"
pm2 list

echo -e "\nApplication Health:"
curl -s http://localhost:5000/health | jq .
```

Make it executable:

```bash
chmod +x /home/appuser/monitor.sh
```

### 3. Backup Script

```bash
nano /home/appuser/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/appuser/app

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and schedule:

```bash
chmod +x /home/appuser/backup.sh
crontab -e
```

Add daily backup at 2 AM:

```bash
0 2 * * * /home/appuser/backup.sh
```

## Deployment Checklist

- [ ] Server updated and secured
- [ ] Dependencies installed (Node.js, MongoDB, Nginx, PM2)
- [ ] Application cloned and configured
- [ ] Environment variables set
- [ ] Frontend built successfully
- [ ] Nginx configured and tested
- [ ] SSL certificate obtained
- [ ] DNS records configured
- [ ] PM2 process manager setup
- [ ] Monitoring and backup scripts created
- [ ] Firewall configured
- [ ] Application accessible via domain

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Backend not running

   ```bash
   pm2 restart report-admin-backend
   pm2 logs
   ```

2. **MongoDB Connection Issues**:

   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

3. **SSL Certificate Issues**:

   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

4. **DNS Propagation**:
   ```bash
   nslookup yourdomain.com
   dig yourdomain.com
   ```

### Useful Commands

```bash
# Check application logs
pm2 logs report-admin-backend

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check system resources
htop
df -h
free -h

# Test API endpoint
curl -X GET http://localhost:5000/health

# Check open ports
sudo netstat -tlnp
```

## Security Best Practices

1. **Regular Updates**: Keep system and dependencies updated
2. **Firewall**: Only open necessary ports
3. **SSH Keys**: Use SSH keys instead of passwords
4. **Environment Variables**: Never commit secrets to version control
5. **Database Security**: Configure MongoDB authentication
6. **Rate Limiting**: Already configured in your Express app
7. **HTTPS Only**: Redirect all HTTP traffic to HTTPS
8. **Regular Backups**: Automated daily backups
9. **Monitoring**: Set up alerts for system issues
10. **Log Management**: Regular log rotation and monitoring

Your application should now be accessible at `https://yourdomain.com`!

## U

TM-Specific Considerations

### Network Configuration Summary

**For galaxy.gra8sal.xyz deployment:**

1. **UTM Network Setup**: Use bridged network mode for direct IP access
2. **DNS Configuration**: Point `galaxy.gra8sal.xyz` to your VM's IP address
3. **Router Setup**: Configure port forwarding (80, 443) if accessing from internet
4. **Local Testing**: VM accessible on local network immediately after bridged setup

### Performance Tips for UTM

- **RAM**: Allocate 4GB+ for smooth operation
- **CPU**: Use 2+ cores for better performance
- **Storage**: SSD recommended for database operations
- **Network**: Bridged mode offers best performance

### Development Workflow

```bash
# SSH from Mac to Ubuntu VM
ssh appuser@VM_IP_ADDRESS

# Use VS Code Remote SSH
code --remote ssh-remote+appuser@VM_IP_ADDRESS /home/appuser/app
```

### Backup Strategy

1. **UTM Snapshots**: Before major changes
2. **File Backups**: Automated daily backups (as configured above)
3. **VM Export**: Weekly full VM backup

### Troubleshooting UTM Issues

**VM Not Accessible:**

```bash
# Check VM IP
ip addr show

# Test from Mac
ping VM_IP_ADDRESS
```

**Port Issues:**

```bash
# Check if ports are open in VM
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

**DNS Not Resolving:**

```bash
# Test DNS resolution
nslookup galaxy.gra8sal.xyz
dig galaxy.gra8sal.xyz
```

Your React + Node.js application should now be fully deployed and accessible at `https://galaxy.gra8sal.xyz`!
