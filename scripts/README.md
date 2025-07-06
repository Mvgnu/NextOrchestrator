# Scripts

This directory contains helper scripts for development and deployment.

## setup-dev.sh

Sets up the local development environment by installing dependencies and running database migrations.

- **Purpose:** bootstrap development environment
- **Usage:** `./setup-dev.sh`
- **Depends on:** `.env.example` for database credentials

## deploy.sh

Simple build and start helper for production deployments.

- **Purpose:** install dependencies, build the Next.js app and start the server
- **Usage:** `./deploy.sh`

