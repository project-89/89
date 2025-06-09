# Proxim8 Client Deployment Guide

This guide covers deploying the Proxim8 frontend to various platforms with the correct environment configuration.

## 🎯 Quick Fix for Current Netlify Deployment

Your Netlify build is failing because the environment variables aren't set up yet. Here's how to fix it:

### 1. Set Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add these variables:

```
NEXT_PUBLIC_API_URL=https://proxim8-server-dev-k2k5q5npjq-uc.a.run.app/api
NEXT_PUBLIC_API_KEY=proxim8-dev-key
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_APP_NAME=Proxim8 NFT Video Platform
NEXT_PUBLIC_NOTIFICATION_TIMEOUT=5000
NODE_ENV=production
```

### 2. Fix Build Settings

In Netlify, ensure your build settings are:
- **Build command**: `pnpm build` or `npm run build`
- **Publish directory**: `.next`
- **Node version**: `18.x` (set in Environment variables as `NODE_VERSION=18`)

### 3. Redeploy

After setting the environment variables, trigger a new deployment by:
- Pushing a new commit, OR
- Going to **Deploys** tab and clicking **Trigger deploy** > **Deploy site**

## 🚀 Platform-Specific Deployment Instructions

### Netlify Deployment

#### Prerequisites
- GitHub repository connected to Netlify
- Backend service deployed and accessible

#### Steps

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the `client` folder as the base directory

2. **Configure Build Settings**:
   ```
   Build command: pnpm build
   Publish directory: .next
   Base directory: client
   ```

3. **Set Environment Variables**:
   - Go to Site Settings > Environment variables
   - Add all variables from `netlify-env-vars.txt`
   - Key variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url/api
     NEXT_PUBLIC_API_KEY=your-api-key
     NODE_ENV=production
     NODE_VERSION=18
     ```

4. **Deploy**:
   - Push to your main branch or trigger manual deploy
   - Monitor build logs for any issues

#### Troubleshooting Netlify

**Build fails with "process.env not defined"**:
- Ensure all `NEXT_PUBLIC_*` variables are set in Netlify environment settings
- Check that `NODE_ENV=production` is set

**Build fails with Node.js version errors**:
- Set `NODE_VERSION=18` in environment variables
- Or add `.nvmrc` file to client directory with content `18`

**API calls fail in production**:
- Verify `NEXT_PUBLIC_API_URL` points to the correct backend
- Check that the backend allows CORS for your Netlify domain

### Vercel Deployment

#### Steps

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - Set **Root Directory** to `client`
   - Framework should auto-detect as "Next.js"
   - Build settings should auto-populate

3. **Set Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add all `NEXT_PUBLIC_*` variables
   - Apply to Production, Preview, and Development environments

4. **Deploy**:
   - Push to your main branch
   - Vercel will automatically deploy

### AWS Amplify Deployment

#### Steps

1. **Connect Repository**:
   - Go to AWS Amplify Console
   - Click "New app" > "Host web app"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd client
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: client/.next
       files:
         - '**/*'
   ```

3. **Set Environment Variables**:
   - Go to App Settings > Environment variables
   - Add all `NEXT_PUBLIC_*` variables

4. **Deploy**:
   - Save and deploy

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.proxim8.com/api` |
| `NEXT_PUBLIC_API_KEY` | API authentication key | `proxim8-prod-key` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network | `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Proxim8 NFT Video Platform` |
| `NEXT_PUBLIC_NOTIFICATION_TIMEOUT` | Notification timeout (ms) | `5000` |

### Platform-Specific Variables

**Netlify**:
```
NODE_VERSION=18
NETLIFY_NEXT_PLUGIN_SKIP=true  # if having Next.js plugin issues
```

**Vercel**:
- All variables are automatically available during build

**AWS Amplify**:
```
_LIVE_UPDATES=[{"name":"Next.js version","pkg":"next","type":"major","version":"latest"}]
```

## 🏗️ Build Optimization

### Next.js Configuration

Your `next.config.js` is already optimized for deployment:

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [/* allowed image domains */],
  },
  // Output configuration for different platforms
  output: 'standalone', // Uncomment for Docker deployment
  trailingSlash: true,  // Uncomment for static hosting
};
```

### Performance Optimizations

1. **Image Optimization**: Already configured in `next.config.js`
2. **Bundle Analysis**: Run `npm run analyze` to check bundle size
3. **Tree Shaking**: Automatically handled by Next.js
4. **Code Splitting**: Automatically handled by Next.js

## 🔍 Deployment Verification

After deployment, verify your application:

1. **Health Check**: Visit `https://your-domain.com/api/health`
2. **API Connectivity**: Check browser console for API errors
3. **Wallet Connection**: Test wallet connection functionality
4. **NFT Loading**: Verify NFTs load correctly
5. **Video Generation**: Test video generation flow

### Common Issues

**CORS Errors**:
- Backend must allow your domain in `ALLOWED_ORIGINS`
- Check backend CORS configuration

**Environment Variables Not Working**:
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart build after adding new variables

**Build Timeout**:
- Increase build timeout in platform settings
- Optimize build by removing unused dependencies

## 📊 Monitoring Production

### Performance Monitoring

1. **Netlify Analytics**: Enable in site settings
2. **Vercel Analytics**: Available in project dashboard
3. **Google Analytics**: Add to your application
4. **Web Vitals**: Monitor Core Web Vitals

### Error Tracking

1. **Sentry**: Add error tracking
2. **LogRocket**: Session replay
3. **Browser Console**: Monitor for errors

### Uptime Monitoring

1. **UptimeRobot**: Free uptime monitoring
2. **Pingdom**: Advanced monitoring
3. **StatusPage**: Status page for users

## 🚀 Advanced Deployment

### Docker Deployment

If you prefer Docker deployment:

```dockerfile
# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### CDN Configuration

For better performance, configure CDN:

1. **Cloudflare**: Free CDN and security
2. **AWS CloudFront**: If using AWS
3. **Vercel Edge Network**: Built-in with Vercel

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)

## 🤝 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Test the backend API directly
4. Check platform-specific build logs
5. Create an issue in the repository 