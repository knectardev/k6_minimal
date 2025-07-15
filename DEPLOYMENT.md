# Knectar Portfolio - Deployment Guide

This guide covers deploying the Knectar portfolio website to various hosting platforms.

## Prerequisites

- Node.js 16+ installed
- Git repository access
- Environment variables configured

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd K6_MINIMAL
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the site**
   - Open http://localhost:8000
   - The site will auto-reload on changes

## Production Deployment

### Option 1: Traditional Hosting (Apache/Nginx)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload files to server**
   - Upload all files except `node_modules/`
   - Ensure `server.js` is in the root directory

3. **Install production dependencies**
   ```bash
   npm install --production
   ```

4. **Configure environment variables**
   - Set up environment variables on your hosting platform
   - Ensure `EDIT_SECRET` and `ELEVEN_API_KEY` are configured

5. **Start the server**
   ```bash
   npm start
   ```

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment variables**
   - Go to Vercel dashboard
   - Add environment variables in project settings

### Option 3: Netlify Deployment

1. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "."
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   ```

2. **Deploy via Git**
   - Connect your repository to Netlify
   - Configure environment variables in Netlify dashboard

### Option 4: Railway Deployment

1. **Connect repository**
   - Connect your Git repository to Railway

2. **Configure environment variables**
   - Add environment variables in Railway dashboard

3. **Deploy**
   - Railway will automatically deploy on push to main branch

## Environment Variables

### Required Variables

- `EDIT_SECRET`: Secure string for menu editing authentication
- `ELEVEN_API_KEY`: ElevenLabs API key for TTS functionality

### Optional Variables

- `ELEVEN_VOICE_ID`: Voice ID for TTS (default: "Rachel")
- `TTS_DEBUG`: Enable TTS debugging (default: false)
- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment (development/production)

## SSL/HTTPS Configuration

### Let's Encrypt (Recommended)

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot
   ```

2. **Obtain certificate**
   ```bash
   sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Performance Optimization

### Image Optimization

1. **Run optimization script**
   ```bash
   npm run optimize-images
   ```

2. **Monitor file sizes**
   - Check `project_tiles/` directory
   - Ensure images are under 200KB

### Caching

1. **Static assets**
   - CSS, JS, and images are automatically cached
   - TTS audio files cached for 24 hours

2. **Browser caching**
   - Configure appropriate cache headers for your hosting platform

## Monitoring and Maintenance

### Health Checks

- Monitor `/api/health` endpoint
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Logs

- Monitor server logs for errors
- Check TTS cache directory size
- Review API usage and limits

### Updates

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Restart server**
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:8000 | xargs kill`

2. **TTS not working**
   - Check ELEVEN_API_KEY is set
   - Verify API key is valid
   - Check network connectivity

3. **Menu updates failing**
   - Verify EDIT_SECRET is set
   - Check file permissions on data/ directory
   - Ensure server has write access

### Support

For deployment issues, check:
- Server logs
- Environment variable configuration
- Network connectivity
- File permissions

## Security Considerations

1. **Environment variables**
   - Never commit .env files
   - Use secure random strings for secrets
   - Rotate API keys regularly

2. **File permissions**
   - Restrict access to sensitive directories
   - Use appropriate file permissions

3. **HTTPS**
   - Always use HTTPS in production
   - Configure secure headers

4. **API rate limiting**
   - Monitor API usage
   - Implement rate limiting if needed 