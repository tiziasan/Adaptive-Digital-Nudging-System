#!/bin/bash

# Go to project folder
cd /work/EnergyWebExpDet

# Install Node.js (if not already on UCloud machine)
sudo apt update
sudo apt install -y nodejs npm

# Install dependencies
npm install

# Start server explicitly bound to 0.0.0.0
HOST=0.0.0.0 PORT=5000 node server.js &

# Kill any existing NGINX processes
sudo pkill nginx

# Wait 2 seconds to ensure the port is free
sleep 10

# Start your custom NGINX config in foreground
sudo nginx -c /work/EnergyWebExpDet/nginx.conf -g 'daemon off;'