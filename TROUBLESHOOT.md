# 🔧 Coolify Deployment Troubleshooting

## ❓ What exactly didn't work? Check your issue below:

### 1. 🚫 **"Can't find the repository"**
**Problem**: Coolify can't see `enochodu1/map-web-manager`

**Solutions**:
- ✅ Verify GitHub connection in Coolify settings
- ✅ Make sure repository is public
- ✅ Check repository name is exactly: `enochodu1/map-web-manager`
- ✅ Refresh the repository list in Coolify

### 2. 🔨 **"Build failed"**
**Problem**: Docker build errors during deployment

**Check build logs for these common issues**:
```bash
# If you see "Dockerfile not found":
✅ Set Build Context: . (dot)
✅ Set Dockerfile Path: Dockerfile

# If you see "npm install failed":
✅ Check internet connection in build environment
✅ Verify package.json files exist

# If you see "Permission denied":
✅ Check file permissions in repository
```

### 3. 🚀 **"Build succeeded but app won't start"**
**Problem**: Container starts but application crashes

**Solutions**:
```bash
# Check these settings:
✅ Internal Port: 3001 (not 3000)
✅ Health Check URL: /api/health
✅ Environment variables set correctly

# Required Environment Variables:
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-domain.com
DB_PATH=/app/data/database.sqlite
```

### 4. 🌐 **"Can't access the application"**
**Problem**: Build successful but can't open the website

**Solutions**:
- ✅ Wait 2-5 minutes after "deployment successful"
- ✅ Check if domain is assigned in Coolify
- ✅ Verify port 3001 is configured as internal port
- ✅ Try accessing: `your-domain.com/api/health`

### 5. 🔐 **"GitHub authentication issues"**
**Problem**: Coolify can't access your GitHub

**Solutions**:
- ✅ Reconnect GitHub in Coolify settings
- ✅ Check if GitHub App permissions are correct
- ✅ Verify App ID 1558272 is active

## 🐛 **Debug Steps**

### Step 1: Check Repository Access
```bash
# Verify repository exists and is accessible:
curl -s https://api.github.com/repos/enochodu1/map-web-manager
```

### Step 2: Test Docker Build Locally
```bash
# Build the Docker image locally:
docker build -t mcp-web-manager .

# Run it locally to test:
docker run -p 3001:3001 -e NODE_ENV=production mcp-web-manager
```

### Step 3: Check Coolify Settings
- Repository: `enochodu1/map-web-manager`
- Branch: `main`
- Build Method: `Docker`
- Build Context: `.`
- Dockerfile Path: `Dockerfile`
- Internal Port: `3001`

## 🆘 **Still Not Working?**

Tell me exactly what you see:

1. **What step failed?** (Repository selection, build, deployment, access)
2. **What error message** do you see in Coolify?
3. **Where in the process** did it stop working?

I can then give you specific solutions for your exact issue!

## 📋 **Quick Verification Checklist**
- [ ] Repository `enochodu1/map-web-manager` exists on GitHub
- [ ] Repository is public and accessible
- [ ] Coolify is connected to your GitHub account
- [ ] Build method is set to "Docker"
- [ ] Internal port is set to 3001
- [ ] All 4 environment variables are configured
- [ ] Dockerfile exists in repository root

**Repository URL**: https://github.com/enochodu1/map-web-manager 