# BackForCatalog

Node.js backend for React Native e-commerce application with OAuth-based authentication and Shopify integration.

## Tech Stack

- **Runtime**: Node.js 20.x LTS
- **Framework**: Fastify + TypeScript
- **Authentication**: OAuth 2.0 (mock) + JWT (jose)
- **Storage**: In-memory (Map)
- **Testing**: Vitest
- **Linting/Formatting**: Biome
- **Package Manager**: pnpm
- **Hosting**: Vercel

## Features

- ✅ Product catalogue with pagination
- ✅ Checkout with inventory management
- ✅ OAuth 2.0 authentication flow (email-based)
- ✅ JWT token generation and validation
- ✅ Rate limiting
- ✅ Request validation
- ✅ Comprehensive logging
- ✅ Unit and integration tests
- ✅ Health check endpoint

## Prerequisites

- Node.js >= 20.0.0
- pnpm package manager

Install pnpm globally if you haven't already:
```bash
npm install -g pnpm
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd BackForCatalog

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration (optional for development)
```

## Development

```bash
# Start development server with hot reload
pnpm dev

# The server will start on http://localhost:3000
```

**Note**: The development server uses default environment variables from `.env.example`. For testing with custom configuration, update your `.env` file.

## Building

```bash
# Build for production
pnpm build

# The compiled JavaScript will be output to ./dist
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Linting & Formatting

```bash
# Check code quality
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

**Note**: The project uses Biome for linting and formatting. A `.biomeignore` file excludes build outputs from checks.

## Running Production Build Locally

```bash
# Build the project
pnpm build

# Start production server
pnpm start

# For testing production mode with default config
pnpm start:prod
```

**Important**: For local production testing, the server will use default JWT_SECRET with a console warning. For real production deployment on Vercel, set environment variables in the Vercel dashboard.

## API Endpoints

### Health Check

```http
GET /health
```

Returns server health status.

### Catalogue

```http
GET /catalog?page=1&limit=10
```

Returns active products with pagination.

**Query Parameters**:
- `page` (optional): Page number, default is 1
- `limit` (optional): Items per page, default is 10, maximum is 100

### Authentication

#### Login (Get Authorization Code)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Returns an authorization code valid for 10 minutes.

**Response**:
```json
{
  "authorizationCode": "...",
  "expiresIn": 600
}
```

#### Token Exchange

```http
POST /auth/token
Content-Type: application/json

{
  "code": "authorization_code_from_login"
}
```

Exchanges authorization code for JWT access token.

**Response**:
```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Checkout

```http
POST /checkout
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2
    }
  ]
}
```

Validates items, calculates total amount, creates payment intent, and updates inventory.

**Response**:
```json
{
  "success": true,
  "totalAmount": 39.98,
  "currency": "GBP",
  "paymentIntent": {
    "id": "pi_...",
    "status": "pending",
    "amount": 39.98
  },
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2,
      "unitPrice": 19.99,
      "subtotal": 39.98
    }
  ]
}
```

### Protected Endpoints

Include the JWT token in the Authorization header for protected endpoints:

```http
Authorization: Bearer <your_jwt_token>
```

## Project Structure

```
BackForCatalog/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── storage/         # In-memory data store
│   ├── middleware/      # Custom middleware (auth, error handling)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (config, validation, JWT)
│   └── server.ts        # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── data/
│   └── products.json    # Initial product data
├── .biomeignore         # Files ignored by Biome linter
├── biome.json           # Biome configuration
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Vitest configuration
├── vercel.json          # Vercel deployment configuration
├── .env.example         # Environment variables template
├── assumptions-tradeoffs.md  # Detailed project assumptions and design decisions
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

**Key variables**:
- `JWT_SECRET`: Secret key for JWT signing (**required for production**)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `RATE_LIMIT_MAX`: Maximum requests per time window (default: 100)
- `JWT_EXPIRATION`: Token expiration time (default: 1h)
- `OAUTH_CODE_EXPIRATION`: Authorization code expiration (default: 10m)

**Development**: Default values from `.env.example` are used automatically.

**Production**: Set all environment variables in your hosting platform's dashboard.

## Deployment

### Vercel Deployment

The project is pre-configured for Vercel deployment.

1. **Install Vercel CLI** (optional):
```bash
pnpm add -g vercel
```

2. **Set Environment Variables** in Vercel Dashboard:
   - Navigate to your project settings
   - Add all variables from `.env.example`
   - **Important**: Generate a secure `JWT_SECRET` for production:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
     ```

3. **Deploy**:
```bash
# Via CLI
vercel

# Or deploy to production directly
vercel --prod

# Or connect your Git repository to Vercel for automatic deployments
```

**Automatic Deployment**: Push to your main branch to trigger automatic deployment if you've connected your repository to Vercel.

### Environment Variables for Production

When deploying to Vercel, ensure you set these in the Vercel Dashboard (Settings → Environment Variables):

```
JWT_SECRET=<generated-secure-secret>
NODE_ENV=production
JWT_ISSUER=backforcatalog
JWT_AUDIENCE=backforcatalog-app
JWT_EXPIRATION=1h
OAUTH_CODE_EXPIRATION=10m
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=15m
LOG_LEVEL=info
```

## Assumptions and Trade-offs

For detailed information about architectural decisions, implementation assumptions, issues encountered during development, and production considerations, see:

**[assumptions-tradeoffs.md](./assumptions-tradeoffs.md)**

This document covers:
- Technology stack choices and rationale
- In-memory storage trade-offs
- Mock OAuth implementation decisions
- Security considerations for demo vs production
- Issues resolved during development
- Production readiness checklist

## Future Enhancements

- [ ] Add persistent storage (MongoDB/PostgreSQL)
- [ ] Implement real OAuth providers (Google, GitHub)
- [ ] Add user registration and password management
- [ ] Implement refresh token rotation
- [ ] Add comprehensive API documentation (Swagger/OpenAPI)
- [ ] Add distributed rate limiting with Redis
- [ ] Implement order management system
- [ ] Add webhook support for Shopify integration
- [ ] Increase test coverage to 80%+
- [ ] Add monitoring and alerting (Sentry, DataDog)

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm start:prod` | Start production server with production environment |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Generate test coverage report |
| `pnpm lint` | Check code quality |
| `pnpm lint:fix` | Fix linting issues automatically |
| `pnpm format` | Format code with Biome |
| `pnpm type-check` | Run TypeScript type checking |

## Licence

MIT

## Support

For issues and questions, please create an issue in the repository.

---

**Built with Fastify, TypeScript, and modern Node.js best practices.**