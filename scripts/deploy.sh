#!/bin/bash
set -euo pipefail

# purpose: Build and start application for deployment
# inputs: package.json
# outputs: production build, running server
# status: stable
# related_docs: scripts/README.md

# Simple deployment script
# Installs dependencies, builds the Next.js app, and starts the server.

npm install
npm run build
npm start
