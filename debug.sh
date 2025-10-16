#!/bin/bash

echo "=== Docker Container Debug Script ==="
echo ""

# Check if container is running
echo "1. Checking container status..."
docker ps -a | grep ai-content-frontend
echo ""

# Check container logs
echo "2. Container logs (last 20 lines)..."
docker logs --tail 20 ai-content-frontend
echo ""

# Check nginx config
echo "3. Testing nginx configuration..."
docker exec ai-content-frontend nginx -t
echo ""

# Check if port is listening
echo "4. Checking port 3000..."
sudo netstat -tlnp | grep 3000
echo ""

# Check from inside container
echo "5. Testing from inside container..."
docker exec ai-content-frontend curl -I http://localhost:3000
echo ""

# Check from host
echo "6. Testing from host (localhost)..."
curl -I http://localhost:3000
echo ""

echo "7. Testing from host (127.0.0.1)..."
curl -I http://127.0.0.1:3000
echo ""

echo "8. Testing from host (IP address)..."
curl -I http://180.93.138.113:3000
echo ""

# Check file structure
echo "9. Checking file structure in container..."
docker exec ai-content-frontend ls -la /usr/share/nginx/html/
echo ""

echo "10. Checking assets directory..."
docker exec ai-content-frontend ls -la /usr/share/nginx/html/assets/
echo ""

# Check nginx error log
echo "11. Nginx error log (last 10 lines)..."
docker exec ai-content-frontend tail -10 /var/log/nginx/error.log
echo ""

# Check nginx access log
echo "12. Nginx access log (last 10 lines)..."
docker exec ai-content-frontend tail -10 /var/log/nginx/access.log
echo ""

# Check firewall
echo "13. Checking firewall status..."
sudo ufw status
echo ""

echo "=== Debug Complete ==="
echo "Please share the output if you need further assistance."