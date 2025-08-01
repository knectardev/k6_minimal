# 301 Redirect System Documentation

This document explains the 301 redirect implementation for the Knectar portfolio website.

## Overview

The redirect system supports multiple deployment scenarios and provides a flexible, maintainable approach to URL redirection. It includes:

- **Express.js server-level redirects** (primary method)
- **Platform-specific configurations** (Netlify, Vercel, Nginx)
- **Management tools** for adding/removing redirects
- **Validation** to prevent circular redirects

## Architecture

### 1. Express.js Server Redirects (Primary)

The main redirect system is implemented in `server.js` and uses `redirects.json` for configuration.

**Features:**
- Loads redirects from external JSON file
- Supports exact matches, patterns, and wildcards
- Handles trailing slash normalization
- Processes redirects before serving static files

**Configuration Structure:**
```json
{
  "redirects": {
    "exact": {
      "/old-page": "/new-page.html"
    },
    "patterns": {
      "/category/old": "/projects.html#category"
    },
    "wildcards": {
      "/old-blog/*": "/blog.html"
    }
  }
}
```

### 2. Platform-Specific Configurations

#### Netlify (`netlify.toml`)
- Static redirect rules for Netlify hosting
- API function routing
- SPA fallback handling

#### Vercel (`vercel.json`)
- Route-based redirects for Vercel deployment
- Node.js server integration
- Static file serving

#### Nginx (`nginx.conf`)
- Server-level redirects for traditional hosting
- SSL termination and security headers
- Proxy configuration for Node.js backend

## Usage

### Managing Redirects

#### Using NPM Scripts
```bash
# List all redirects
npm run redirects:list

# Add a new redirect
npm run redirects:add exact /old-page /new-page.html

# Remove a redirect
npm run redirects:remove exact /old-page

# Validate redirects
npm run redirects:validate
```

#### Using the Script Directly
```bash
# List redirects
node scripts/manage_redirects.js list

# Add redirects
node scripts/manage_redirects.js add exact /old-about /about.html
node scripts/manage_redirects.js add wildcards /old-blog/* /blog.html

# Remove redirects
node scripts/manage_redirects.js remove exact /old-about

# Validate configuration
node scripts/manage_redirects.js validate
```

### Redirect Types

#### 1. Exact Matches
```bash
npm run redirects:add exact /old-about /about.html
```
- Matches exact URL paths
- Fastest processing
- Use for specific page redirects

#### 2. Patterns
```bash
npm run redirects:add patterns /higher-education /projects.html#higher-education
```
- Matches specific patterns
- Good for category redirects
- Supports query parameters and fragments

#### 3. Wildcards
```bash
npm run redirects:add wildcards /old-blog/* /blog.html
```
- Uses `*` for pattern matching
- Good for bulk redirects
- Supports regex-like patterns

## Common Redirect Scenarios

### 1. Page Renames
```bash
npm run redirects:add exact /old-about /about.html
npm run redirects:add exact /old-projects /projects.html
```

### 2. Category Consolidation
```bash
npm run redirects:add patterns /healthcare /projects.html#healthcare
npm run redirects:add patterns /education /projects.html#higher-education
```

### 3. Blog Migration
```bash
npm run redirects:add wildcards /old-blog/* /blog.html
npm run redirects:add exact /legacy-blog /blog.html
```

### 4. Trailing Slash Normalization
```bash
npm run redirects:add exact /about/ /about.html
npm run redirects:add exact /projects/ /projects.html
```

### 5. Project-Specific Redirects
```bash
npm run redirects:add exact /projects/old-project /project.html?item=new-project-slug
```

## Validation

The system includes validation to prevent common issues:

### Automatic Checks
- **Circular redirects**: Prevents A → B → A scenarios
- **Invalid destinations**: Ensures destinations start with `/`
- **Configuration format**: Validates JSON structure

### Manual Validation
```bash
npm run redirects:validate
```

## Deployment Considerations

### 1. Express.js Server (Recommended)
- **Pros**: Full control, dynamic configuration, easy testing
- **Cons**: Requires Node.js server
- **Best for**: Development, testing, custom hosting

### 2. Netlify
- **Pros**: Static hosting, automatic HTTPS, CDN
- **Cons**: Limited to static redirects
- **Best for**: Static sites, simple redirects

### 3. Vercel
- **Pros**: Serverless functions, automatic scaling
- **Cons**: Cold starts for API routes
- **Best for**: Modern deployments, serverless architecture

### 4. Nginx
- **Pros**: High performance, full control
- **Cons**: Requires server management
- **Best for**: Traditional hosting, high-traffic sites

## Testing

### Local Testing
```bash
# Start development server
npm run dev

# Test redirects
curl -I http://localhost:8000/old-about
curl -I http://localhost:8000/old-blog/some-post
```

### Production Testing
```bash
# Test with curl
curl -I https://yourdomain.com/old-about

# Check response headers
curl -I https://yourdomain.com/old-about | grep -i location
```

## Monitoring

### Log Analysis
Monitor server logs for redirect activity:
```bash
# Watch redirect logs
tail -f /var/log/nginx/access.log | grep "301"

# Check Express.js logs
pm2 logs server
```

### Analytics
- Track redirect performance in Google Analytics
- Monitor 404 errors that might need redirects
- Check search console for crawl errors

## Best Practices

### 1. SEO Considerations
- Use 301 (permanent) redirects for permanent changes
- Keep redirects active for at least 6-12 months
- Update internal links to point to new URLs
- Submit new sitemap to search engines

### 2. Performance
- Keep redirect chains short (A → B, not A → B → C)
- Use exact matches when possible for speed
- Monitor redirect performance impact

### 3. Maintenance
- Regularly review and clean up old redirects
- Test redirects after deployments
- Document redirect reasons and expiration dates

### 4. Security
- Validate redirect destinations
- Prevent open redirects
- Monitor for suspicious redirect patterns

## Troubleshooting

### Common Issues

#### 1. Redirect Not Working
```bash
# Check if redirect exists
npm run redirects:list

# Validate configuration
npm run redirects:validate

# Check server logs
tail -f /var/log/nginx/error.log
```

#### 2. Circular Redirects
```bash
# Validate redirects
npm run redirects:validate

# Check for A → B → A patterns
```

#### 3. Performance Issues
- Use exact matches instead of wildcards when possible
- Limit the number of redirects
- Consider caching redirects in memory

### Debug Mode
Enable debug logging in Express.js:
```javascript
// Add to server.js
if (process.env.REDIRECT_DEBUG) {
  console.log('Redirect check:', requestPath);
}
```

## Migration Guide

### From Static .htaccess
1. Convert Apache rules to redirects.json format
2. Test each redirect individually
3. Deploy and monitor for issues

### From Nginx Config
1. Extract location blocks to redirects.json
2. Update nginx.conf to use proxy_pass
3. Test redirects before removing old rules

### From Platform-Specific Rules
1. Export existing redirects
2. Convert to redirects.json format
3. Deploy and validate

## Support

For issues or questions:
1. Check this documentation
2. Run validation: `npm run redirects:validate`
3. Review server logs
4. Test with curl or browser dev tools

## Changelog

### v1.0.0 (2024-01-01)
- Initial implementation
- Express.js server integration
- Management scripts
- Platform-specific configurations
- Validation system 