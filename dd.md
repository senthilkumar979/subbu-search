# Technical Documentation
## Thoothukudi District Electoral Roll Search Application

**Technology Stack:** Next.js 15, MongoDB, TypeScript, Mono Repo


### Key Highlights

✅ **HMAC-Based API Security**: Prevents unauthorized direct API access (Postman/curl) through cryptographic signature authentication

✅ **MongoDB Atlas Integration**: Database restricted to Vercel server IPs only with TLS encryption

✅ **Vercel Bot Management**: DDoS protection, rate limiting, and anti-abuse measures enabled

✅ **High Performance**: optimized queries, connection pooling, and edge caching

✅ **Bilingual Support**: Full Tamil and English language support for voter names and search


## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌────────────┐      
│  │  Browser   │     
│  │  Desktop   │           
│  └────────────┘ 
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              VERCEL EDGE NETWORK                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Bot Management (Anti-abuse)                       │   |
│  │  • Global CDN (Edge Caching)                         │   │
│  │  • SSL/TLS Termination                               │   │
│  │  • Web Analytics (@vercel/analytics)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│           NEXT.JS 15 APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              APP ROUTER (Next.js 15)                   │ │
│  │                    ┌──────────────┐  ┌─────────────┐ │ │
│  │                    │  API Routes  │  │ Middleware  │ │ │
│  │                    │  (Serverless)│  │   (Edge)    │ │ │
│  │                    └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          SECURITY LAYER                                 │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  HMAC Signature Authentication                    │  │ │
│  │  │  • Client-side signing (client-hmac.ts)          │  │ │
│  │  │  • Server-side verification (api-middleware.ts)  │  │ │
│  │  │  • Nonce-based replay protection                 │  │ │
│  │  │  • API_SECRET (server-only, never exposed)       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          BUSINESS LOGIC LAYER                           │ │
│  │  • Voter Search Engine                                  │ │
│  │  • Polling Station Lookup                               │ │
│  │  • Data Aggregation & Transformation                    │ │
│  │  • Bilingual Name Search (Tamil/English)                │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Mongoose ODM
                        │ Connection Pooling
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              DATABASE LAYER                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           MongoDB Atlas (Cloud Database)                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Collections:                                     │  │ │
│  │  │  • ac210 (Vilathikulam)                          │  │ │
│  │  │  • ac211 (Ottapidaram SC)                        │  │ │
│  │  │  • ac212 (Kovilpatti)                            │  │ │
│  │  │  • ac224 (Sattankulam)                           │  │ │
│  │  │  • ac225 (Tiruchendur)                           │  │ │
│  │  │  • ac226 (Srivaikuntam)                          │  │ │
│  │  │  • ac227 (Thoothukudi)                           │  │ │
│  │  │  • legacyparts (Polling Station Metadata)        │  │ │
│  │  │  • voters (Legacy/Default collection)            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  Security Features:                                      │ │
│  │  • IP Whitelisting (Vercel servers only)                │ │
│  │  • Database User Authentication                          │ │
│  │  • Role-Based Access Control (RBAC)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

#### API Request Flow (with HMAC Authentication)

```
1. Client needs data
   ↓
2. Client calls signedFetch('/api/voters/search')
   ↓
3. signedFetch requests signature from /api/auth/sign
   ↓
4. Server generates HMAC signature using API_SECRET
   ↓
5. Client receives signature
   ↓
6. Client makes actual API request with signed headers:
   - X-Timestamp: 1732093847234
   - X-Nonce: bG9yZW0gaXBzdW0=
   - X-Signature: ij8ysQl8sOAZBNg2O49lF/7sD3v0l6XM4r3smTPkwKI=
   - X-API-Key: tuticorin-gov-app-2025
   ↓
7. API Middleware (withApiProtection) verifies:
   - All headers present ✓
   - API key matches ✓
   - Timestamp within 5 minutes ✓
   - HMAC signature valid ✓
   ↓
8. If valid → Execute API handler
   If invalid → Return 403 Forbidden
   ↓
9. API handler queries MongoDB
   ↓
10. Data returned to client
```


## Security Implementation

### HMAC-Based API Authentication

**Objective:** Prevent unauthorized direct API access via Postman, curl, or other HTTP clients.

#### Architecture Components

**1. Server-side HMAC Utilities (`lib/hmac.ts`)**

```typescript
// Key Functions:
- generateSignature(data: string): string
  • Creates HMAC-SHA256 signature using API_SECRET
  • Uses Node.js crypto module
  • Returns base64-encoded signature

- verifySignature(data: string, signature: string): boolean
  • Verifies signature using timing-safe comparison
  • Prevents timing attacks via crypto.timingSafeEqual()

- verifyTimestamp(timestamp: number, maxAgeMs?: number): boolean
  • Validates request freshness (default: 5 minutes)
  • Prevents replay attacks
```

**2. Client-side Signing Utilities (`lib/client-hmac.ts`)**

```typescript
// Key Functions:
- signedFetch(url: string, options?: RequestInit): Promise<Response>
  • Auto-generates signed headers
  • Requests signature from /api/auth/sign
  • Sends request with HMAC signature

- createSignedHeaders(requestData?: object): Promise<HeadersInit>
  • Generates X-Timestamp, X-Nonce, X-Signature, X-API-Key
  • Uses Web Crypto API (browser-compatible)
```

**3. API Middleware (`lib/api-middleware.ts`)**

```typescript
// Key Functions:
- withApiProtection(handler): ProtectedHandler
  • HOF wrapper for GET requests
  • Verifies all required headers
  • Returns 403 if invalid

- withApiProtectionAndBody<T>(handler): ProtectedHandler
  • HOF wrapper for POST/PUT/PATCH with body validation
  • Includes request body in signature verification
```

**4. Signing Endpoint (`app/api/auth/sign/route.ts`)**

```typescript
// POST /api/auth/sign
- Receives payload from client
- Validates timestamp (1-minute window)
- Generates HMAC signature using API_SECRET
- Returns signature to client
- Should be protected with rate limiting in production
```


#### Protected API Routes

| Route | Method | Protection | Purpose |
|-------|--------|------------|---------|
| `/api/polling-stations` | GET | ✅ HMAC | Fetch polling stations by constituency |
| `/api/voters/search` | GET | ✅ HMAC | Search voters with filters |
| `/api/auth/sign` | POST | ❌ None | Generate HMAC signatures (rate-limited) |
| `/api/example/protected` | GET/POST | ✅ HMAC | Example/demo route |

