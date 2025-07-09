#!/bin/bash

echo "🚀 MCP Web Manager - Coolify Deployment Assistant"
echo "=================================================="
echo ""

# Check if git repository exists and is up to date
echo "📋 Checking repository status..."
if git status >/dev/null 2>&1; then
    echo "✅ Git repository found"
    
    # Check if there are uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        echo "⚠️  Uncommitted changes detected. Committing..."
        git add .
        git commit -m "Auto-commit before Coolify deployment"
    fi
    
    # Push latest changes
    echo "📤 Pushing latest changes to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Code successfully pushed to GitHub!"
    else
        echo "❌ Failed to push to GitHub. Please check your connection."
        exit 1
    fi
else
    echo "❌ Not a git repository. Please run from project root."
    exit 1
fi

echo ""
echo "🎯 Coolify Deployment Instructions:"
echo "===================================="
echo ""
echo "1. Open your Coolify dashboard:"
echo "   → Go to your Coolify instance"
echo ""
echo "2. Create New Application:"
echo "   → Click '+' or 'New Resource'"
echo "   → Select 'Application'"
echo "   → Choose 'GitHub' as source"
echo ""
echo "3. Repository Configuration:"
echo "   → Repository: enochodu1/map-web-manager"
echo "   → Branch: main"
echo "   → Build Method: Docker"
echo ""
echo "4. Environment Variables (copy these exactly):"
echo "   NODE_ENV=production"
echo "   PORT=3001"
echo "   CLIENT_URL=https://your-assigned-domain.com"
echo "   DB_PATH=/app/data/database.sqlite"
echo ""
echo "5. Port Configuration:"
echo "   → Internal Port: 3001"
echo "   → Health Check: /api/health"
echo ""
echo "6. Deploy:"
echo "   → Click 'Deploy'"
echo "   → Wait 2-5 minutes for build completion"
echo ""
echo "📱 After deployment:"
echo "==================="
echo "1. Update CLIENT_URL with your actual Coolify domain"
echo "2. Redeploy the application"
echo "3. Test the application at your assigned URL"
echo ""
echo "🔗 Repository: https://github.com/enochodu1/map-web-manager"
echo "📋 Deployment Guide: Check COOLIFY-DEPLOYMENT.md for detailed instructions"
echo ""
echo "✨ Your application is ready for Coolify deployment!" 