#!/bin/bash
set -e

# purpose: Setup local development environment with dependencies and migrations
# inputs: .env.example
# outputs: node_modules installed, database schema migrated
# status: stable
# related_docs: scripts/README.md

echo "Setting up development environment..."

# Install dependencies if missing
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# Prepare local env file for Postgres
if [ ! -f env.local.postgres ]; then
  echo "Creating env.local.postgres from template..."
  cp .env.example env.local.postgres
  echo "Please edit env.local.postgres with your database credentials."
fi

# Run database migrations
echo "Running database migrations..."
npm run db:migrate:up

echo "Setup complete."
