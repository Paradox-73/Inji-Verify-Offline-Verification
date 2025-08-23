# Inji Offline VC Verifier

A comprehensive Next.js PWA for offline Verifiable Credential verification with secure storage and background sync.

## Features

- **Offline-First**: Verify credentials without internet connection
- **QR Code Scanning**: Camera-based QR code scanning for VCs
- **Secure Storage**: AES-GCM encryption with HMAC integrity protection
- **Background Sync**: Automatic sync when connectivity is restored
- **Trust Cache**: Manage trusted credential issuers
- **PWA Support**: Installable progressive web app
- **Comprehensive Testing**: Unit and E2E tests included

## Tech Stack

### Frontend
- **Next.js 13** with App Router and TypeScript
- **next-pwa** for service worker and offline capabilities
- **Tailwind CSS** + **shadcn/ui** for styling
- **html5-qrcode** for QR scanning
- **Dexie** for IndexedDB storage
- **WebCrypto** for encryption
- **Zustand** for state management

### Backend
- **Next.js API Routes** for sync endpoints
- **Prisma** ORM with SQLite (demo) / PostgreSQL (production)
- **Zod** for runtime validation

### Testing & QA
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **ESLint** + **Prettier** for code quality

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd inji-offline-verifier

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Initialize database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Database
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
```

## Project Structure

```
inji-offline-verifier/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── scan/                # QR scan page
│   ├── history/             # Verification history
│   ├── trust/               # Trust cache manager
│   ├── settings/            # Settings page
│   └── api/                 # Backend API routes
├── components/              # Shared UI components
├── lib/                     # Core libraries
│   ├── db.ts                # Dexie IndexedDB setup
│   ├── prisma.ts            # Prisma client
│   ├── crypto.ts            # Encryption utilities
│   ├── verify.ts            # VC verification logic
│   └── types.ts             # TypeScript types
├── workers/                 # Web Workers
├── tests/                   # Testing
└── public/                  # Static assets
```

## Core Features

### QR Code Scanning
- Camera-based QR code scanning
- Support for multiple VC formats (JSON, URL, Base64)
- Real-time scanning with visual feedback

### Offline Verification
- Complete verification without internet
- Schema validation
- Digital signature verification
- Expiration checking
- Trust cache validation

### Secure Storage
- AES-GCM encryption for all stored data
- HMAC-SHA256 for tamper detection
- IndexedDB for offline storage
- Configurable storage limits

### Background Sync
- Automatic sync when online
- Retry logic with exponential backoff
- Wi-Fi only sync option
- Manual sync triggers

### Trust Management
- Add/remove trusted issuers
- Public key management
- Revocation endpoint configuration
- Trust status indicators

## API Endpoints

### Verification Results
- `POST /api/verifications` - Sync verification results
- `GET /api/verifications` - Retrieve synced results

### Health Check
- `GET /api/health` - Service health status

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# API Configuration  
API_TOKEN="your-api-token-here"

# Development
NODE_ENV="development"
```

### PWA Configuration

The app is configured as a PWA with:
- Offline support via service worker
- App manifest for installation
- Background sync capabilities
- Push notification support (optional)

## Testing

### Unit Tests
```bash
npm run test
```

Tests cover:
- VC verification logic
- Encryption/decryption
- Database operations
- Component functionality

### E2E Tests
```bash
npm run test:e2e
```

E2E tests cover:
- Complete scan-to-verification flow
- History management
- Settings configuration
- Offline functionality

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
# Build image
docker build -t inji-vc-verifier .

# Run container
docker run -p 3000:3000 inji-vc-verifier
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your platform of choice

## Security Considerations

- All verification results are encrypted at rest
- HMAC verification prevents data tampering
- Secure key derivation using PBKDF2
- No sensitive data in localStorage
- CSP headers for XSS protection

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- WebCrypto API
- IndexedDB
- Service Workers
- Camera API (for QR scanning)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions