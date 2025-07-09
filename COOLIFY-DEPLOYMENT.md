# Coolify Deployment Guide for MCP Web Manager

## ✅ Prerequisites Complete
- [x] GitHub repository created: `map-web-manager`
- [x] Code pushed to GitHub
- [x] Coolify connected to GitHub (App ID: 1558272)

## 🚀 Deployment Steps

### 1. Create New Application in Coolify

1. **Login to your Coolify dashboard**
2. **Click "+" or "New Resource"**
3. **Select "Application"**
4. **Choose "GitHub" as source** (should already be connected)
5. **Select Repository:**
   - Repository: `enochodu1/map-web-manager`
   - Branch: `main`

### 2. Configure Application Settings

#### Basic Settings:
- **Name**: `mcp-web-manager`
- **Description**: `MCP Web Manager - A web-based management system for Model Context Protocol servers`

#### Build Settings:
- **Build Method**: `Docker`
- **Build Context**: `.` (root directory)
- **Dockerfile Path**: `Dockerfile`
- **Build Arguments**: None required

### 3. Environment Variables

Set the following environment variables in Coolify:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-coolify-domain.com
DB_PATH=/app/data/database.sqlite
```

**Note**: Replace `your-coolify-domain.com` with the actual domain Coolify assigns to your application.

### 4. Port Configuration

- **Internal Port**: `3001`
- **External Port**: Will be automatically assigned by Coolify
- **Health Check URL**: `/api/health`

### 5. Volume Configuration (Optional)

For persistent data storage, add a volume:
- **Mount Path**: `/app/data`
- **Host Path**: Choose a persistent path on your server

### 6. Deploy the Application

1. **Click "Deploy"**
2. **Monitor the build logs** for any issues
3. **Wait for deployment to complete** (usually 2-5 minutes)

## 📋 Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Application builds successfully
- [ ] No errors in deployment logs
- [ ] Application is accessible via the provided URL
- [ ] Health check endpoint responds: `GET /api/health`

### 2. Test Basic Functionality
- [ ] Web interface loads correctly
- [ ] Can create new MCP server configurations
- [ ] WebSocket connections work
- [ ] Database operations function properly

### 3. Update Environment Variables
- [ ] Update `CLIENT_URL` with the actual Coolify domain
- [ ] Redeploy after updating environment variables

## 🔧 Application Architecture

### Services:
1. **Frontend (Next.js)**: Runs on port 3000 internally
2. **Backend API**: Runs on port 3001 (main entry point)
3. **SQLite Database**: Stored in `/app/data/database.sqlite`
4. **WebSocket Server**: Integrated with the backend API

### Key Features:
- MCP server management
- Real-time status monitoring
- Configuration management
- Folder organization
- Health monitoring

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check Dockerfile syntax
   - Verify all dependencies are properly defined
   - Review build logs for specific errors

2. **Application Won't Start**:
   - Verify environment variables are set correctly
   - Check if port 3001 is properly configured
   - Review application logs

3. **Database Issues**:
   - Ensure `/app/data` directory has proper permissions
   - Check if volume is mounted correctly
   - Verify SQLite is accessible

4. **WebSocket Connection Fails**:
   - Confirm WebSocket support is enabled in Coolify
   - Check proxy configuration
   - Verify CORS settings

### Debug Commands:

```bash
# Check application logs
docker logs <container-id>

# Access container shell
docker exec -it <container-id> /bin/sh

# Verify file structure
ls -la /app/

# Check running processes
ps aux
```

## 🔄 Updates and Maintenance

### Automatic Deployments:
- Configure webhooks for automatic deployment on git push
- Set up branch protection if needed

### Manual Deployment:
1. Push changes to `main` branch
2. Coolify will automatically detect changes
3. Trigger rebuild in Coolify dashboard if needed

### Monitoring:
- Use Coolify's built-in monitoring
- Check application health regularly via `/api/health`
- Monitor resource usage and scale as needed

## 📞 Support

If you encounter issues:
1. Check Coolify documentation
2. Review application logs
3. Verify environment configuration
4. Test locally with Docker to isolate issues

---

**Repository**: https://github.com/enochodu1/map-web-manager
**Coolify App ID**: 1558272
**Deployment Status**: Ready for deployment 