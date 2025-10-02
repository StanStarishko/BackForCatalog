# BackForCatalog

Node.js backend for React Native e-commerce application with OAuth-based authentication and Shopify integration.

## Tech Stack

- **Runtime**: Node.js 20.x LTS
- **Framework**: Fastify + TypeScript
- **Authentication**: OAuth 2.0 (mock) + JWT (jose)
- **Storage**: In-memory (Map)
- **Testing**: Vitest
- **Linting/Formatting**: Biome
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

## Prerequisites

- Node.js >= 20.0.0
- pnpm package manager (install with `npm install -g pnpm`)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd BackForCatalog

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Development

```bash
# Start development server with hot reload
pnpm dev

# The server will start on http://localhost:3000
```

## Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
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

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

## API Endpoints

### Catalogue

```http
GET /catalog?page=1&limit=10
```

Returns active products with pagination.

### Checkout

```http
POST /checkout
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

Validates items, calculates total amount, and updates inventory.

### Authentication

#### Login (Get Authorization Code)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Returns an authorization code.

#### Token Exchange

```http
POST /auth/token
Content-Type: application/json

{
  "code": "authorization_code_from_login"
}
```

Exchanges authorization code for JWT access token.

### Protected Endpoints

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## Project Structure

```
BackForCatalog/
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── storage/         # In-memory data store
│   ├── middleware/      # Custom middleware
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── data/
│   └── products.json    # Initial product data
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `RATE_LIMIT_MAX`: Maximum requests per time window
- `JWT_EXPIRATION`: Token expiration time

## Deployment

### Vercel

The project is configured for Vercel deployment:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Ensure you set environment variables in the Vercel dashboard.

## Assumptions and Trade-offs

### Assumptions
- Email-based authentication is sufficient for MVP
- In-memory storage is acceptable (data resets on restart)
- Mock OAuth flow meets business requirements
- Single server instance (no distributed caching)

### Trade-offs
- **In-memory storage**: Simple but not persistent. Easy to swap for MongoDB/Redis later.
- **Mock OAuth**: Simplified flow without password verification. Can extend to real OAuth providers.
- **Single instance**: Rate limiting works per instance. Consider Redis for distributed systems.
- **No database**: Fast development, but requires migration strategy for production.

## Future Enhancements

- [ ] Add persistent storage (MongoDB/PostgreSQL)
- [ ] Implement real OAuth providers (Google, GitHub)
- [ ] Add user registration and password management
- [ ] Implement refresh token rotation
- [ ] Add comprehensive API documentation (Swagger/OpenAPI)
- [ ] Add distributed rate limiting with Redis
- [ ] Implement order management system
- [ ] Add webhook support for Shopify integration

## Licence

MIT

## Support

For issues and questions, please create an issue in the repository.