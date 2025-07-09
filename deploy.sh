#!/bin/bash

echo "🚀 MCP Web Manager Deployment Script"
echo "======================================"

# Check if repository exists
echo "📋 Checking repository status..."
git remote -v

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Code successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next Steps for Coolify Deployment:"
    echo "1. Go to your Coolify dashboard"
    echo "2. Create new application"
    echo "3. Select GitHub as source"
    echo "4. Choose 'mcp-web-manager' repository"
    echo "5. Set build method to 'Docker'"
    echo "6. Configure environment variables:"
    echo "   - NODE_ENV=production"
    echo "   - PORT=3001"
    echo "   - CLIENT_URL=https://your-domain.com"
    echo "   - DB_PATH=/app/data/database.sqlite"
    echo "7. Set persistent storage for /app/data"
    echo "8. Deploy!"
    echo ""
    echo "🔗 Repository URL: https://github.com/enochodu1/mcp-web-manager"
else
    echo "❌ Failed to push to GitHub"
    echo "Please ensure the repository exists at: https://github.com/enochodu1/mcp-web-manager"
    echo "Create it manually at: https://github.com/new"
fi 