export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Explicit isolated Aura Lab route. This avoids Static Assets HTML
    // normalization/redirect behavior that can return AccessDenied on some clients.
    if (url.pathname === '/aura-lab' || url.pathname === '/aura-lab/') {
      const assetUrl = new URL('/aura-lab.html', url.origin);
      const assetRequest = new Request(assetUrl.toString(), request);
      const response = await env.ASSETS.fetch(assetRequest);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    return response;
  }
};
