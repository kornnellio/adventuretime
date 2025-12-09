#!/bin/bash

# Create the upload directory if it doesn't exist
UPLOAD_DIR=${UPLOAD_DIR:-/var/www/ia_caiace_uploads}

echo "Setting up upload directory at $UPLOAD_DIR"

# Create directory if it doesn't exist
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "Creating directory $UPLOAD_DIR"
  mkdir -p "$UPLOAD_DIR"
fi

# Set permissions (adjust as needed for your server setup)
echo "Setting permissions on $UPLOAD_DIR"
chmod 2775 "$UPLOAD_DIR"

# If you're using a specific user/group for your web server
# For example, for nginx or apache:
# chown www-data:www-data "$UPLOAD_DIR"

echo "Upload directory setup complete!" 