#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install any new dependencies
npm install

# Restart the application workflow if needed
# Workflow reconciliation is handled separately

echo "Post-merge setup complete."
