# VividPlate

A restaurant menu and ordering platform.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

For deployment instructions and build trigger configuration, see [DEPLOY.md](./DEPLOY.md).

#### Quick Deploy Commands

```bash
# Deploy using Cloud Build (recommended)
./scripts/deploy-cloud-build.sh YOUR_PROJECT_ID

# Deploy using Docker + Cloud Run
./scripts/deploy-cloud-run.sh YOUR_PROJECT_ID

# Update build trigger to use main branch HEAD
./scripts/update-build-trigger.sh YOUR_PROJECT_ID
```

## Build Trigger Issue?

If your Cloud Build is deploying an old commit instead of the latest code on `main`, see the [Deployment Guide](./DEPLOY.md) for detailed troubleshooting steps.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
SESSION_SECRET=change-me
TELEGRAM_BOT_TOKEN=
CHAPA_SECRET_KEY=
PORT=8080
NODE_ENV=production
```

## Documentation

- [Deployment Guide](./DEPLOY.md) - Build trigger configuration and deployment
- [Telegram Bot Guide](./TELEGRAM_BOT_GUIDE.md) - Telegram bot setup
- [Design Guidelines](./design_guidelines.md) - UI/UX guidelines
