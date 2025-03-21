import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Versuche zuerst, statische Assets zu servieren
      const url = new URL(request.url);
      
      // API-Anfragen an Hono-Router weiterleiten
      if (url.pathname.startsWith('/api')) {
        const { default: apiRouter } = await import('./api');
        return apiRouter.fetch(request, env, ctx);
      }
      
      // Assets aus KV laden
      const asset = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        env.ASSETS
      );
      
      // Asset-Cache-Kontrolle
      const response = new Response(asset.body, asset);
      
      // Cache-Header für bessere Performance
      response.headers.set('Cache-Control', 'public, max-age=3600');
      
      return response;
    } catch (e) {
      // Wenn kein Asset gefunden wurde, serviere die React-App
      const html = `
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Globe Flags</title>
            <link rel="stylesheet" href="/assets/main.css">
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/assets/main.js"></script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=300' 
        },
      });
    }
  },
}; 