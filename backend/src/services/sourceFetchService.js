const https = require('https');
const http = require('http');
const { URL } = require('url');

class SourceFetchService {
  constructor() {
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AgriNexa/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
    };
  }

  async fetchWithRetry(targetUrl, options = {}, retries = 3, backoffMs = 1500) {
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this._executeRequest(targetUrl, options);
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const waitTime = backoffMs * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
    }

    throw new Error(`Failed to fetch ${targetUrl} after ${retries} attempts: ${lastError ? lastError.message : 'Unknown error'}`);
  }

  _executeRequest(targetUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const timeoutMs = options.timeout || 12000;
      let timedOut = false;

      const reqOptions = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: { ...this.defaultHeaders, ...(options.headers || {}) },
        // Crucial for Indian Govt portals (.gov.in / .nic.in) which use internal GoI CAs
        rejectUnauthorized: false
      };

      const req = client.request(reqOptions, (res) => {
        // Follow redirects up to 3 hops
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return resolve(this._executeRequest(redirectUrl, { ...options, redirectCount: (options.redirectCount || 0) + 1 }));
        }

        let rawData = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          rawData += chunk;
          // Guard against memory explosion for huge downloads
          if (rawData.length > 5 * 1024 * 1024) {
            req.destroy();
            reject(new Error('Response size exceeded 5MB limit'));
          }
        });

        res.on('end', () => {
          if (timedOut) return;
          resolve({
            url: targetUrl,
            status: res.statusCode,
            headers: res.headers,
            body: rawData,
            contentType: res.headers['content-type'] || ''
          });
        });
      });

      req.on('error', (err) => {
        if (!timedOut) reject(err);
      });

      req.setTimeout(timeoutMs, () => {
        timedOut = true;
        req.destroy();
        reject(new Error(`Connection timed out after ${timeoutMs}ms for ${targetUrl}`));
      });

      if (options.body) {
        req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
      }

      req.end();
    });
  }
}

module.exports = new SourceFetchService();
