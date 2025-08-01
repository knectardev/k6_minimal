#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

class LegacySiteScraper {
  constructor(baseUrl = 'https://www.knectar.com') {
    this.baseUrl = baseUrl;
    this.visitedUrls = new Set();
    this.foundUrls = new Set();
    this.errors = [];
    this.maxDepth = 3;
    this.maxUrls = 1000; // Safety limit
    this.excludedPatterns = [
      /\.(jpg|jpeg|png|gif|svg|css|js|pdf|zip|doc|docx|xls|xlsx)$/i,
      /mailto:/,
      /tel:/,
      /#/,
      /javascript:/,
      /admin/,
      /wp-admin/,
      /wp-content/,
      /wp-includes/,
      /cgi-bin/,
      /\.well-known/,
      /robots\.txt/,
      /sitemap\.xml/
    ];
  }

  // Make HTTP request
  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KnectarSiteScraper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            url: url
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // Extract URLs from HTML content
  extractUrls(html, baseUrl) {
    const urls = new Set();
    
    // Match href attributes
    const hrefMatches = html.match(/href=["']([^"']+)["']/gi) || [];
    hrefMatches.forEach(match => {
      const url = match.replace(/href=["']([^"']+)["']/i, '$1');
      if (url && !url.startsWith('#')) {
        const absoluteUrl = this.resolveUrl(url, baseUrl);
        if (absoluteUrl && this.isValidUrl(absoluteUrl)) {
          urls.add(absoluteUrl);
        }
      }
    });

    // Match src attributes (for potential redirects)
    const srcMatches = html.match(/src=["']([^"']+)["']/gi) || [];
    srcMatches.forEach(match => {
      const url = match.replace(/src=["']([^"']+)["']/i, '$1');
      if (url && !url.startsWith('#')) {
        const absoluteUrl = this.resolveUrl(url, baseUrl);
        if (absoluteUrl && this.isValidUrl(absoluteUrl)) {
          urls.add(absoluteUrl);
        }
      }
    });

    return Array.from(urls);
  }

  // Resolve relative URLs to absolute URLs
  resolveUrl(url, baseUrl) {
    try {
      if (url.startsWith('http')) {
        return url;
      }
      return new URL(url, baseUrl).href;
    } catch (error) {
      return null;
    }
  }

  // Check if URL should be included
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Only include URLs from the same domain
      if (urlObj.hostname !== new URL(this.baseUrl).hostname) {
        return false;
      }

      // Exclude based on patterns
      for (const pattern of this.excludedPatterns) {
        if (pattern.test(url)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Crawl a single page
  async crawlPage(url, depth = 0) {
    if (depth > this.maxDepth || this.visitedUrls.size >= this.maxUrls) {
      return;
    }

    if (this.visitedUrls.has(url)) {
      return;
    }

    this.visitedUrls.add(url);
    console.log(`🔍 Crawling (depth ${depth}): ${url}`);

    try {
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 200) {
        this.foundUrls.add(url);
        
        // Extract URLs from the page
        const urls = this.extractUrls(response.body, url);
        
        // Recursively crawl found URLs
        for (const foundUrl of urls) {
          if (depth < this.maxDepth && !this.visitedUrls.has(foundUrl)) {
            await this.crawlPage(foundUrl, depth + 1);
          }
        }
      } else {
        console.log(`⚠️  Status ${response.statusCode}: ${url}`);
      }
    } catch (error) {
      console.log(`❌ Error crawling ${url}: ${error.message}`);
      this.errors.push({ url, error: error.message });
    }
  }

  // Start the crawling process
  async crawl() {
    console.log(`🚀 Starting crawl of ${this.baseUrl}`);
    console.log(`📊 Max depth: ${this.maxDepth}, Max URLs: ${this.maxUrls}`);
    
    await this.crawlPage(this.baseUrl);
    
    console.log(`\n✅ Crawl completed!`);
    console.log(`📈 Found ${this.foundUrls.size} unique URLs`);
    console.log(`❌ ${this.errors.length} errors encountered`);
    
    return Array.from(this.foundUrls);
  }

  // Save results to file
  saveResults(urls, filename = 'legacy_site_inventory.json') {
    const results = {
      baseUrl: this.baseUrl,
      crawledAt: new Date().toISOString(),
      totalUrls: urls.length,
      errors: this.errors,
      urls: urls.map(url => {
        const urlObj = new URL(url);
        return {
          fullUrl: url,
          path: urlObj.pathname,
          query: urlObj.search,
          fragment: urlObj.hash
        };
      })
    };

    const outputPath = path.join(__dirname, '..', filename);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
    
    return results;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'https://www.knectar.com';
  const outputFile = args[1] || 'legacy_site_inventory.json';

  console.log('🕷️  Legacy Site Scraper');
  console.log('========================\n');

  const scraper = new LegacySiteScraper(baseUrl);
  
  try {
    const urls = await scraper.crawl();
    const results = scraper.saveResults(urls, outputFile);
    
    console.log('\n📋 Summary:');
    console.log(`   Base URL: ${results.baseUrl}`);
    console.log(`   Total URLs: ${results.totalUrls}`);
    console.log(`   Errors: ${results.errors.length}`);
    console.log(`   Output: ${outputFile}`);
    
    // Show some example URLs
    console.log('\n🔗 Sample URLs found:');
    results.urls.slice(0, 10).forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.path}`);
    });
    
    if (results.urls.length > 10) {
      console.log(`   ... and ${results.urls.length - 10} more`);
    }
    
  } catch (error) {
    console.error('❌ Crawl failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LegacySiteScraper; 