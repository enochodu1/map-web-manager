# Coolify Deployment Configuration for MCP Web Manager

## Prerequisites
- Coolify instance running
- GitHub connected to Coolify (✅ Already done - App ID: 1558272)
- Repository: `enochodu1/mcp-web-manager`

## Deployment Steps

### 1. Create New Application in Coolify
- Go to your Coolify dashboard
- Click "New Application"
- Select "GitHub" as source
- Choose repository: `enochodu1/mcp-web-manager`
- Branch: `main`

### 2. Build Configuration
- **Build Method**: Docker
- **Build Context**: `.` (root directory)
- **Dockerfile Path**: `Dockerfile`
- **Build Arguments**: None required

### 3. Environment Variables
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-assigned-domain.com
DB_PATH=/app/data/database.sqlite
```

### 4. Port Configuration
- **Internal Port**: 3001 (API server)
- **Public Port**: 80/443 (handled by Coolify)
- **Additional Port**: 3003 (Next.js client - internal only)

### 5. Persistent Storage
- **Mount Path**: `/app/data`
- **Description**: SQLite database and logs storage

### 6. Health Check
- **Endpoint**: `/api/health`
- **Port**: 3001
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

### 7. Deployment Commands
No custom deployment commands needed - Docker handles everything.

## Post-Deployment
1. Access your application at the assigned Coolify domain
2. Check logs in Coolify dashboard
3. Monitor health checks
4. Configure any additional domains if needed

## Troubleshooting
- If build fails, check Docker logs in Coolify
- Ensure all dependencies are in package.json files
- Verify environment variables are set correctly
- Check persistent storage permissions 