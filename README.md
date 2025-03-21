# React + Vite + Hono + Cloudflare Workers

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

- 🔥 Hot Module Replacement (HMR) for rapid development
- 📦 TypeScript support out of the box
- 🛠️ ESLint configuration included
- ⚡ Zero-config deployment to Cloudflare's global network
- 🎯 API routes with Hono's elegant routing
- 🔄 Full-stack development setup

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant web applications at the edge.

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/globeflags2
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npx wrangler deploy
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)

# GlobeFlags2

Ein interaktiver 3D-Globus mit Länderflaggen, gebaut mit React Three Fiber und Cloudflare Workers.

## Entwicklung

### Voraussetzungen

- Node.js 20 oder höher
- npm 10 oder höher
- Ein Cloudflare-Konto

### Installation

1. Repository klonen:
```bash
git clone https://github.com/Chomeles/globeflags2.git
cd globeflags2
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

### Deployment

Das Projekt verwendet GitHub Actions für automatische Deployments zu Cloudflare Workers.

#### Einrichtung der CI/CD-Pipeline

1. In den GitHub Repository-Einstellungen folgende Secrets hinzufügen:
   - `CLOUDFLARE_API_TOKEN`: Ein Cloudflare API-Token mit Workers-Berechtigung
   - `CLOUDFLARE_ACCOUNT_ID`: Ihre Cloudflare Account-ID

2. Push zu `main` löst automatisch ein Deployment aus.

### Manuelles Deployment

```bash
npm run build
npm run deploy
```

## Umgebungsvariablen

- `CLOUDFLARE_API_TOKEN`: Cloudflare API-Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account-ID

## Lizenz

MIT
