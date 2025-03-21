import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Versuche zuerst, statische Assets zu servieren
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        env.ASSETS
      );
    } catch (e) {
      // Wenn kein Asset gefunden wurde, serviere die React-App
      const html = `
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Globe Flags</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/index.js"></script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  },
}; 