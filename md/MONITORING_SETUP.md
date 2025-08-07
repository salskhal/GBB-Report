# MDA System Monitoring Setup

## Overview

This document provides comprehensive monitoring setup for the MDA reporting system, including performance monitoring, alerting, and log management.

## Monitoring Components

### 1. Application Health Monitoring

#### Health Check Endpoint
The system provides a health check endpoint at `/api/health` that returns:
- Service status
- Database connectivity
- Memory usage
- System uptime
- CPU load

#### Metrics Endpoint
The system provides metrics at `/api/metrics` that includes:
- User statistics
- Admin statistics
- MDA statistics
- Activity log statistics

### 2. System Resource Monitoring

#### CPU Monitoring
```bash
# Monitor CPU usage
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'

# Alert if CPU usage > 80%
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "High CPU usage: $CPU_USAGE%"
fi
```

#### Memory Monitoring
```bash
# Monitor memory usage
free | awk 'NR==2{printf "%.2f%%", $3*100/$2}'

# Alert if memory usage > 85%
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "High memory usage: $MEMORY_USAGE%"
fi
```

#### Disk Space Monitoring
```bash
# Monitor disk usage
df -h / | awk 'NR==2 {print $5}' | sed 's/%//'

# Alert if disk usage > 85%
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "High disk usage: $DISK_USAGE%"
fi
```

### 3. Database Monitoring

#### MongoDB Health Check
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check database connections
mongosh --eval "db.serverStatus().connections"

# Check slow operations
mongosh --eval "db.currentOp({'secs_running': {\$gte: 3}})"
```

#### Database Performance Metrics
```javascript
// MongoDB performance monitoring queries
db.serverStatus().opcounters
db.serverStatus().mem
db.serverStatus().connections
db.stats()
```

### 4. Application-Specific Monitoring

#### Authentication Monitoring
```bash
# Monitor failed login attempts
tail -1000 /var/log/mda-system/app.log | grep -c "Login failed"

# Monitor successful logins
tail -1000 /var/log/mda-system/app.log | grep -c "Login successful"
```

#### Activity Log Monitoring
```javascript
// Check recent activity logs
db.activities.countDocuments({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
})

// Check activity by type
db.activities.aggregate([
    { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    { $group: { _id: "$action", count: { $sum: 1 } } }
])
```

## Alerting Configuration

### 1. Email Alerts

#### Setup Postfix for Email Alerts
```bash
# Install postfix
sudo apt-get install postfix mailutils

# Configure postfix
sudo dpkg-reconfigure postfix

# Test email
echo "Test email from MDA System" | mail -s "Test Alert" admin@yourdomain.com
```

#### Email Alert Script
```bash
#!/bin/bash
# email_alert.sh

RECIPIENT="admin@yourdomain.com"
SUBJECT="$1"
MESSAGE="$2"
SEVERITY="$3"

# Format message
FULL_MESSAGE="
MDA System Alert
================
Severity: $SEVERITY
Time: $(date)
Server: $(hostname)

Message: $MESSAGE

Please check the system immediately.
"

# Send email
echo "$FULL_MESSAGE" | mail -s "[$SEVERITY] $SUBJECT" $RECIPIENT
```

### 2. Slack Integration

#### Slack Webhook Setup
```bash
#!/bin/bash
# slack_alert.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
CHANNEL="#alerts"
USERNAME="MDA-Monitor"

send_slack_alert() {
    local message="$1"
    local severity="$2"
    local color="good"
    
    case $severity in
        "CRITICAL") color="danger" ;;
        "WARNING") color="warning" ;;
        "INFO") color="good" ;;
    esac
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"channel\": \"$CHANNEL\",
            \"username\": \"$USERNAME\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"MDA System Alert\",
                \"text\": \"$message\",
                \"fields\": [
                    {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                    {\"title\": \"Server\", \"value\": \"$(hostname)\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": false}
                ]
            }]
        }" \
        $WEBHOOK_URL
}
```

### 3. Log-based Alerting

#### Log Monitoring Script
```bash
#!/bin/bash
# log_monitor.sh

LOG_FILE="/var/log/mda-system/app.log"
ERROR_THRESHOLD=10
WARNING_THRESHOLD=20

# Count recent errors
ERROR_COUNT=$(tail -1000 $LOG_FILE | grep -c "ERROR")
WARNING_COUNT=$(tail -1000 $LOG_FILE | grep -c "WARN")

if [ $ERROR_COUNT -gt $ERROR_THRESHOLD ]; then
    ./email_alert.sh "High Error Rate" "Found $ERROR_COUNT errors in last 1000 log entries" "CRITICAL"
fi

if [ $WARNING_COUNT -gt $WARNING_THRESHOLD ]; then
    ./email_alert.sh "High Warning Rate" "Found $WARNING_COUNT warnings in last 1000 log entries" "WARNING"
fi
```

## Log Management

### 1. Log Rotation Configuration

#### Logrotate Setup
```bash
# Create logrotate configuration
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

### 2. Centralized Logging

#### Rsyslog Configuration
```bash
# Configure rsyslog for centralized logging
sudo tee -a /etc/rsyslog.conf << 'EOF'
# MDA System logging
local0.*    /var/log/mda-system/app.log
local1.*    /var/log/mda-system/access.log
local2.*    /var/log/mda-system/error.log
EOF

sudo systemctl restart rsyslog
```

#### Application Logging Configuration
```javascript
// Add to your Express app
import winston from 'winston';
import 'winston-syslog';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/mda-system/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/mda-system/app.log' }),
    new winston.transports.Syslog({
      host: 'localhost',
      port: 514,
      protocol: 'unix',
      facility: 'local0'
    })
  ]
});
```

## Performance Monitoring

### 1. Application Performance Monitoring (APM)

#### Custom Metrics Collection
```javascript
// metrics.js - Custom metrics collection
import promClient from 'prom-client';

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new promClient.Gauge({
  name: 'mda_active_users_total',
  help: 'Number of active users'
});

const reportViews = new promClient.Counter({
  name: 'mda_report_views_total',
  help: 'Total number of report views',
  labelNames: ['mda_name', 'report_title']
});

const authenticationAttempts = new promClient.Counter({
  name: 'mda_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'status']
});

// Export metrics
export { httpRequestDuration, activeUsers, reportViews, authenticationAttempts };
```

#### Middleware for Metrics Collection
```javascript
// monitoring-middleware.js
import { httpRequestDuration, authenticationAttempts } from './metrics.js';

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
};

export const authMetricsMiddleware = (type) => (req, res, next) => {
  res.on('finish', () => {
    const status = res.statusCode < 400 ? 'success' : 'failure';
    authenticationAttempts.labels(type, status).inc();
  });
  
  next();
};
```

### 2. Database Performance Monitoring

#### MongoDB Slow Query Monitoring
```javascript
// mongodb-monitoring.js
import mongoose from 'mongoose';

// Enable profiling for slow operations
mongoose.connection.db.setProfilingLevel(2, { slowms: 100 });

// Monitor slow queries
const monitorSlowQueries = async () => {
  const slowQueries = await mongoose.connection.db
    .collection('system.profile')
    .find({ ts: { $gte: new Date(Date.now() - 60000) } })
    .toArray();
    
  if (slowQueries.length > 0) {
    console.warn(`Found ${slowQueries.length} slow queries in the last minute`);
    // Send alert if needed
  }
};

// Run every minute
setInterval(monitorSlowQueries, 60000);
```

### 3. Real-time Monitoring Dashboard

#### Simple Dashboard HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>MDA System Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric-card { 
            border: 1px solid #ddd; 
            padding: 20px; 
            margin: 10px; 
            border-radius: 5px; 
            display: inline-block;
            width: 200px;
        }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { color: #666; }
        .status-ok { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
    </style>
</head>
<body>
    <h1>MDA System Monitoring Dashboard</h1>
    
    <div id="metrics-container">
        <div class="metric-card">
            <div class="metric-value" id="active-users">-</div>
            <div class="metric-label">Active Users</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="total-mdas">-</div>
            <div class="metric-label">Total MDAs</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="system-status">-</div>
            <div class="metric-label">System Status</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="response-time">-</div>
            <div class="metric-label">Avg Response Time (ms)</div>
        </div>
    </div>
    
    <canvas id="activity-chart" width="800" height="400"></canvas>
    
    <script>
        // Fetch and update metrics
        async function updateMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                document.getElementById('active-users').textContent = data.users.active;
                document.getElementById('total-mdas').textContent = data.mdas.total;
                document.getElementById('system-status').textContent = 'Healthy';
                document.getElementById('system-status').className = 'metric-value status-ok';
                
                // Update chart with activity data
                updateActivityChart(data.activities);
                
            } catch (error) {
                document.getElementById('system-status').textContent = 'Error';
                document.getElementById('system-status').className = 'metric-value status-error';
            }
        }
        
        // Update every 30 seconds
        setInterval(updateMetrics, 30000);
        updateMetrics();
        
        // Initialize activity chart
        const ctx = document.getElementById('activity-chart').getContext('2d');
        const activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Activities per Hour',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        function updateActivityChart(activityData) {
            // Update chart with new data
            // Implementation depends on your data structure
        }
    </script>
</body>
</html>
```

## Automated Monitoring Setup

### 1. Cron Jobs for Regular Monitoring

```bash
# Add to crontab (crontab -e)

# Health check every 5 minutes
*/5 * * * * /opt/mda-system/scripts/monitor.sh

# Log monitoring every 15 minutes
*/15 * * * * /opt/mda-system/scripts/log_monitor.sh

# Database backup daily at 2 AM
0 2 * * * /opt/mda-system/scripts/backup.sh

# Cleanup old logs weekly
0 3 * * 0 /opt/mda-system/scripts/cleanup.sh

# Generate weekly reports
0 9 * * 1 /opt/mda-system/scripts/weekly_report.sh
```

### 2. Systemd Timers (Alternative to Cron)

```bash
# Create systemd timer for monitoring
sudo tee /etc/systemd/system/mda-monitor.timer << 'EOF'
[Unit]
Description=MDA System Monitoring Timer
Requires=mda-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Create corresponding service
sudo tee /etc/systemd/system/mda-monitor.service << 'EOF'
[Unit]
Description=MDA System Monitoring Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/mda-system/scripts/monitor.sh
User=mda-user
EOF

# Enable and start timer
sudo systemctl daemon-reload
sudo systemctl enable mda-monitor.timer
sudo systemctl start mda-monitor.timer
```

## Troubleshooting Monitoring Issues

### Common Issues and Solutions

#### 1. Monitoring Script Not Running
```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
sudo tail -f /var/log/cron.log

# Test script manually
/opt/mda-system/scripts/monitor.sh
```

#### 2. Alerts Not Being Sent
```bash
# Test email configuration
echo "Test" | mail -s "Test" admin@yourdomain.com

# Check mail logs
sudo tail -f /var/log/mail.log

# Test Slack webhook
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test alert"}' \
    YOUR_SLACK_WEBHOOK_URL
```

#### 3. High Resource Usage by Monitoring
```bash
# Check monitoring script resource usage
ps aux | grep monitor

# Optimize monitoring frequency
# Reduce check frequency in cron jobs

# Use more efficient monitoring tools
# Consider using dedicated monitoring solutions
```

## Best Practices

### 1. Monitoring Strategy
- Monitor what matters to your users
- Set appropriate alert thresholds
- Avoid alert fatigue with too many notifications
- Document your monitoring setup
- Regularly review and update monitoring rules

### 2. Performance Considerations
- Don't over-monitor (balance between visibility and performance)
- Use efficient monitoring queries
- Cache monitoring data when possible
- Consider using dedicated monitoring infrastructure

### 3. Security
- Secure monitoring endpoints
- Limit access to monitoring data
- Encrypt monitoring communications
- Regularly update monitoring tools

## Conclusion

This monitoring setup provides comprehensive visibility into the MDA system's health and performance. Customize the configuration based on your specific requirements and infrastructure.

Regular monitoring and proactive alerting will help ensure system reliability and user satisfaction.

**Last Updated**: January 2024
**Version**: 2.0.0