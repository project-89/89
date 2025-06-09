# Proxim8 NFT Video Platform - Next.js Frontend

This is the Next.js version of the Proxim8 NFT Video Platform frontend. The application allows users to generate animated videos from their Proxim8 NFTs using AI.

## Migration from React to Next.js

This project is a migration from the original React application to Next.js. Most of the core functionality has been migrated, but some components and pages are still in progress. See the `migration-summary.md` file for details on what has been migrated and what still needs to be completed.

## Features

- Connect Solana wallet to view and manage NFTs
- Browse and view NFTs in a visual gallery
- Generate videos from NFTs using AI
- View public videos from the community
- Create and claim lore for NFTs
- Configure video generation pipeline
- User profiles with preferences
- Real-time notifications

## 📖 Table of Contents

- [Quick Start](#-quick-start)
- [Development](#-development)
- [Production Deployment](#-production-deployment)
- [API Integration](#-api-integration)
- [Wallet Integration](#-wallet-integration)
- [Authentication](#-authentication)
- [Configuration](#-configuration)
- [Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- A Solana wallet (Phantom, Solflare, etc.)
- Access to the Proxim8 API server

### Installation

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd proxim8-pipeline/client
```

2. **Install dependencies**:
```bash
pnpm install
```

3. Create a `.env.local` file based on the `.env.local.example` provided:
```bash
cp .env.local.example .env.local
```

4. Update the variables in `.env.local` with your specific configuration.

5. **Start the development server**:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Development

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_API_KEY=proxim8-dev-key

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Application Settings
NEXT_PUBLIC_APP_NAME=Proxim8 NFT Video Platform
NEXT_PUBLIC_NOTIFICATION_TIMEOUT=5000
```

## 🚀 Production Deployment

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set build settings**:
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Node version: `18.x` or higher

3. **Configure environment variables** in Netlify:
   - Go to Site Settings > Environment variables
   - Add all variables from `netlify-env-vars.txt`
   - The key variables are:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url/api
     NEXT_PUBLIC_API_KEY=your-api-key
     NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
     NODE_ENV=production
     ```

4. **Deploy**: Push to your main branch or trigger a manual deploy

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set build settings**:
   - Framework: Next.js
   - Build command: `pnpm build`
   - Output directory: `.next`

3. **Configure environment variables** in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all `NEXT_PUBLIC_*` variables from `netlify-env-vars.txt`

4. **Deploy**: Push to your main branch or trigger a manual deploy

### Environment Variables for Production

The client requires these environment variables to connect to your deployed backend:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://your-backend.run.app/api` |
| `NEXT_PUBLIC_API_KEY` | API authentication key | `proxim8-prod-key` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network | `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |

**Important**: See `netlify-env-vars.txt` for the complete list of production environment variables.

## Technology Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- Axios for API requests

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Server-side environment variables (not exposed to the browser)
API_URL=http://localhost:4000
API_KEY=your-api-key-here

# Client-side environment variables (prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The new API proxy system stores sensitive information like API keys securely on the server side.
