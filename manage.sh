#!/bin/bash

# Management script for AI Content Automation Frontend

APP_NAME="ai-content-frontend"
PROJECT_DIR="/var/www/ai-content-automation/frontend"

case "$1" in
    start)
        echo "Starting $APP_NAME..."
        cd $PROJECT_DIR
        pm2 start ecosystem.config.cjs --env production
        ;;
    stop)
        echo "Stopping $APP_NAME..."
        pm2 stop $APP_NAME
        ;;
    restart)
        echo "Restarting $APP_NAME..."
        cd $PROJECT_DIR
        pm2 restart $APP_NAME
        ;;
    reload)
        echo "Reloading $APP_NAME..."
        cd $PROJECT_DIR
        pm2 reload $APP_NAME
        ;;
    status)
        echo "Status of $APP_NAME:"
        pm2 status $APP_NAME
        ;;
    logs)
        echo "Showing logs for $APP_NAME:"
        pm2 logs $APP_NAME
        ;;
    build)
        echo "Building application..."
        cd $PROJECT_DIR
        npm run build
        pm2 restart $APP_NAME
        ;;
    update)
        echo "Updating application..."
        cd $PROJECT_DIR
        git pull origin main
        npm install
        npm run build
        pm2 restart $APP_NAME
        sudo systemctl reload nginx
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|reload|status|logs|build|update}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  reload  - Reload the application (zero downtime)"
        echo "  status  - Show application status"
        echo "  logs    - Show application logs"
        echo "  build   - Build and restart application"
        echo "  update  - Pull latest code, build and restart"
        exit 1
        ;;
esac