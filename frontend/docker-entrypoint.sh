#!/bin/sh
# injects runtime env vars so you don't have to rebuild the image
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL:-}",
};
EOF
