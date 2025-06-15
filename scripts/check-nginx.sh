#!/bin/bash

echo "Checking Nginx configuration and logs (using SSH alias 'vps')..."

ssh vps << 'EOF'
    echo "=== Nginx Configuration Test ==="
    nginx -t

    echo -e "\n=== Nginx Configuration Files ==="
    echo "Main config:"
    cat /etc/nginx/nginx.conf
    echo -e "\nSite config:"
    cat /etc/nginx/sites-enabled/stockpickgame.tideye.com

    echo -e "\n=== Nginx Error Logs ==="
    tail -n 50 /var/log/nginx/error.log

    echo -e "\n=== Nginx Access Logs ==="
    tail -n 50 /var/log/nginx/access.log

    echo -e "\n=== SSL Certificate Status ==="
    certbot certificates
EOF 