// Import necessary module
const { createProxyMiddleware } = require('http-proxy-middleware');

// Utility function for logging
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

// Main handler function for the Froggy Proxy
module.exports = async (req, res) => {
    const queryParams = new URLSearchParams(req.url.split('?')[1]);
    const targetUrl = queryParams.get('url');
    const corsEnabled = queryParams.get('cors') === 'true';
    const addHeaders = queryParams.get('headers') === 'true';

    // Validate the target URL
    if (!targetUrl) {
        log('Error: Missing target URL');
        return res.status(400).json({ error: 'Target URL is required.' });
    }

    // Configure proxy options
    const proxyOptions = {
        target: targetUrl,
        changeOrigin: true,
        selfHandleResponse: true,
        onProxyReq: (proxyReq) => {
            log(`Proxying request to: ${targetUrl}`);
            if (addHeaders) {
                proxyReq.setHeader('X-Proxy-By', 'Froggy Proxy');
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            log(`Received response: ${proxyRes.statusCode} from ${targetUrl}`);
            if (corsEnabled) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
            proxyRes.pipe(res); // Stream response back to client
        },
        onError: (err) => {
            log(`Proxy error: ${err.message}`);
            res.status(500).json({ error: 'An error occurred during proxying.' });
        },
    };

    // Create and execute the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    return proxy(req, res, () => {}); // Vercel serverless functions expect a return value
};
