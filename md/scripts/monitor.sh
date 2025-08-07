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

check_authentication() {
    # Test user authentication endpoint
    RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"test-user","password":"wrongpassword"}')
    
    if ! echo "$RESPONSE" | grep -q "success.*false"; then
        log_message "ERROR: User authentication endpoint not responding correctly"
        return 1
    fi
    
    # Test admin authentication endpoint
    RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/admin/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@admin.com","password":"wrongpassword"}')
    
    if ! echo "$RESPONSE" | grep -q "success.*false"; then
        log_message "ERROR: Admin authentication endpoint not responding correctly"
        return 1
    fi
    
    return 0
}

check_activity_logging() {
    # Check if activity logs are being created
    RECENT_ACTIVITIES=$(mongosh mda_system --quiet --eval "
        db.activities.countDocuments({
            timestamp: { \$gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
    ")
    
    if [ "$RECENT_ACTIVITIES" -eq 0 ]; then
        log_message "WARNING: No activity logs created in the last 24 hours"
        return 1
    fi
    
    return 0
}

send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    log_message "ALERT [$severity]: $message"
    
    # Send email if configured
    if command -v mail > /dev/null 2>&1 && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[$severity] MDA System Alert" $ALERT_EMAIL
    fi
    
    # Send to syslog
    logger -t mda-system "[$severity] $message"
}

# Run all checks
ERRORS=0
WARNINGS=0

echo "Starting MDA System health check at $(date)"

# Critical checks
if ! check_service; then
    send_alert "MDA System service is not running" "CRITICAL"
    ((ERRORS++))
fi

if ! check_database; then
    send_alert "MongoDB is not responding" "CRITICAL"
    ((ERRORS++))
fi

if ! check_api_health; then
    send_alert "API health check failed" "CRITICAL"
    ((ERRORS++))
fi

# Warning checks
if ! check_disk_space; then
    send_alert "High disk usage detected" "WARNING"
    ((WARNINGS++))
fi

if ! check_memory; then
    send_alert "High memory usage detected" "WARNING"
    ((WARNINGS++))
fi

if ! check_authentication; then
    send_alert "Authentication endpoints not responding correctly" "WARNING"
    ((WARNINGS++))
fi

if ! check_activity_logging; then
    send_alert "Activity logging may not be working" "WARNING"
    ((WARNINGS++))
fi

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_message "INFO: All health checks passed"
    echo "✓ All health checks passed"
elif [ $ERRORS -eq 0 ]; then
    log_message "INFO: Health check completed with $WARNINGS warnings"
    echo "⚠ Health check completed with $WARNINGS warnings"
else
    log_message "ERROR: Health check failed with $ERRORS errors and $WARNINGS warnings"
    echo "✗ Health check failed with $ERRORS errors and $WARNINGS warnings"
    send_alert "System health check failed with $ERRORS critical errors" "CRITICAL"
fi

exit $ERRORS