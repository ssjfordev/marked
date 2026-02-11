import puppeteer from '@cloudflare/puppeteer';

interface Env {
  BROWSER: Fetcher;
  OG_SCREENSHOTS: R2Bucket;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function sha256(url: string): Promise<string> {
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/screenshot') {
      return new Response('Not Found', { status: 404 });
    }

    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return new Response('Invalid URL', { status: 400, headers: CORS_HEADERS });
    }

    // Referer check (allow marked-app.com, localhost, or empty referer)
    const referer = request.headers.get('Referer');
    if (referer) {
      try {
        const refererHost = new URL(referer).hostname;
        if (
          !refererHost.endsWith('marked-app.com') &&
          !refererHost.includes('localhost') &&
          !refererHost.endsWith('vercel.app')
        ) {
          return new Response('Forbidden', { status: 403, headers: CORS_HEADERS });
        }
      } catch {
        // Invalid referer URL — allow through
      }
    }

    // Check R2 cache
    const hash = await sha256(targetUrl);
    const cacheKey = `${hash}.webp`;

    const cached = await env.OG_SCREENSHOTS.get(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=2592000',
          ...CORS_HEADERS,
        },
      });
    }

    // Take screenshot via Browser Rendering API
    let browser;
    try {
      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(targetUrl, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });

      const screenshot = await page.screenshot({
        type: 'webp',
        quality: 80,
      });

      await browser.close();

      // Store in R2
      await env.OG_SCREENSHOTS.put(cacheKey, screenshot, {
        httpMetadata: { contentType: 'image/webp' },
      });

      return new Response(screenshot, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=2592000',
          ...CORS_HEADERS,
        },
      });
    } catch {
      if (browser) {
        try {
          await browser.close();
        } catch {
          // ignore close errors
        }
      }
      return new Response(null, {
        status: 404,
        headers: {
          'Cache-Control': 'public, max-age=3600',
          ...CORS_HEADERS,
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;
