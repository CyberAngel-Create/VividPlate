import { Express, Request, Response } from 'express';

export function setupPWARoutes(app: Express) {
  // Serve manifest with proper headers
  app.get('/manifest.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile('manifest.json', { root: 'public' });
  });

  // Serve service worker with proper headers
  app.get('/sw.js', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile('sw.js', { root: 'public' });
  });

  // PWA install endpoint for analytics
  app.post('/api/pwa-install', (req: Request, res: Response) => {
    console.log('PWA install event tracked');
    res.json({ success: true });
  });
}