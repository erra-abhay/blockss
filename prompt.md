You are a senior full-stack blockchain engineer. Build a production-grade, 
multi-tenant Certificate Issuance & Verification Platform using the following 
exact stack. Do not substitute any technology.

═══════════════════════════════════════════════
 EXACT TECH STACK (NON-NEGOTIABLE)
═══════════════════════════════════════════════

Frontend + Backend : Next.js 14 (App Router) — fullstack monorepo
Blockchain Client  : Ethers.js v6
Blockchain Network : Hyperledger Besu (private, QBFT consensus)
Smart Contracts    : Solidity + Hardhat
Database           : PostgreSQL + Prisma ORM (multi-tenant, schema-per-tenant)
PDF Generation     : Puppeteer → save to local filesystem (./storage/certificates/)
Auth               : NextAuth.js v5 (JWT strategy, credentials + OAuth)
Styling            : Tailwind CSS + shadcn/ui
Queue              : BullMQ + Redis (async certificate processing)
Email              : Nodemailer (SMTP)
Container          : Docker + Docker Compose

═══════════════════════════════════════════════
 PROJECT STRUCTURE
═══════════════════════════════════════════════

/
├── app/                          # Next.js App Router
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   └── verify/
│   │       ├── page.tsx          # Public verifier input
│   │       └── [hash]/page.tsx   # Verification result
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar layout, tenant-aware
│   │   ├── dashboard/page.tsx    # Stats overview
│   │   ├── issue/page.tsx        # Single certificate form
│   │   ├── batch/page.tsx        # CSV batch upload
│   │   ├── certificates/
│   │   │   ├── page.tsx          # List + search + filter
│   │   │   └── [id]/page.tsx     # Detail + blockchain proof
│   │   ├── templates/page.tsx    # HTML template editor
│   │   ├── settings/page.tsx     # Tenant settings + wallet
│   │   ├── team/page.tsx         # User management
│   │   └── audit/page.tsx        # Audit log
│   ├── (admin)/
│   │   ├── tenants/page.tsx      # Super admin: all tenants
│   │   └── nodes/page.tsx        # Besu node health
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tenant/
│       │   ├── register/route.ts
│       │   ├── settings/route.ts
│       │   └── users/route.ts
│       ├── certificates/
│       │   ├── route.ts           # GET list, POST issue
│       │   ├── [id]/route.ts      # GET detail, DELETE revoke
│       │   ├── [id]/download/route.ts   # Serve local PDF file
│       │   └── batch/route.ts     # CSV batch trigger
│       ├── verify/
│       │   └── [hash]/route.ts    # Public verification
│       └── webhooks/
│           └── blockchain/route.ts  # Besu event listener
│
├── contracts/                    # Hardhat project
│   ├── CertificateRegistry.sol
│   ├── hardhat.config.ts
│   ├── scripts/deploy.ts
│   └── test/CertificateRegistry.test.ts
│
├── lib/
│   ├── prisma.ts                 # Prisma client with schema switcher
│   ├── ethers.ts                 # Ethers.js Besu provider + signer
│   ├── contract.ts               # CertificateRegistry contract instance
│   ├── pdf.ts                    # Puppeteer PDF generator → local save
│   ├── hash.ts                   # keccak256 certificate hash utility
│   ├── queue.ts                  # BullMQ queue definitions
│   ├── mailer.ts                 # Nodemailer instance
│   └── tenant.ts                 # Tenant resolution middleware
│
├── workers/
│   └── certificate.worker.ts     # BullMQ worker process
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── storage/
│   └── certificates/             # Local PDF storage
│       └── {tenant_slug}/
│           └── {certificate_id}.pdf
│
├── besu-network/
│   ├── docker-compose.besu.yml
│   ├── genesis.json
│   └── nodes/ (validator configs)
│
├── docker-compose.yml
├── .env.example
└── README.md

═══════════════════════════════════════════════
 SOLIDITY SMART CONTRACT
═══════════════════════════════════════════════

File: contracts/CertificateRegistry.sol

pragma solidity ^0.8.20;

Implement the following:

STRUCTS:
  CertificateRecord {
    bytes32   hash;
    string    tenantId;
    string    recipientId;
    string    courseId;
    uint256   issuedAt;
    uint256   expiresAt;    // 0 = no expiry
    bool      revoked;
    address   issuedBy;
  }

STORAGE:
  mapping(bytes32 => CertificateRecord) public certificates
  mapping(address => bool) public authorizedIssuers
  mapping(address => string) public issuerTenant
  address public owner

MODIFIERS:
  onlyOwner
  onlyAuthorizedIssuer
  onlyTenantIssuer(string tenantId)  -- issuer must belong to that tenant

FUNCTIONS:
  constructor()
  addIssuer(address issuer, string tenantId)       onlyOwner
  removeIssuer(address issuer)                      onlyOwner
  issueCertificate(
    bytes32 hash,
    string tenantId,
    string recipientId,
    string courseId,
    uint256 expiresAt
  )                                                 onlyTenantIssuer(tenantId)
  revokeCertificate(bytes32 hash)                  onlyTenantIssuer
  verifyCertificate(bytes32 hash)
    returns (CertificateRecord memory, bool isValid)
    -- isValid = exists && !revoked && (expiresAt==0 || expiresAt > block.timestamp)
  getCertificatesByTenant(string tenantId)         -- returns bytes32[] (use events for indexing)

EVENTS:
  CertificateIssued(bytes32 indexed hash, string tenantId, string recipientId, uint256 issuedAt)
  CertificateRevoked(bytes32 indexed hash, string tenantId, address revokedBy)
  IssuerAdded(address indexed issuer, string tenantId)
  IssuerRemoved(address indexed issuer)

Hardhat config: target Besu local network (http://localhost:8545, chainId 1337)
Write full Hardhat test suite covering all functions and edge cases.

═══════════════════════════════════════════════
 POSTGRESQL + PRISMA — MULTI-TENANT SCHEMA
═══════════════════════════════════════════════

Use schema-per-tenant isolation in PostgreSQL.
Public schema holds shared platform data.
Each tenant gets its own schema named after its slug.

PUBLIC SCHEMA (schema.prisma — public models):

model Tenant {
  id                    String    @id @default(uuid())
  name                  String
  slug                  String    @unique   -- used as PG schema name
  plan                  String    @default("free")
  walletAddress         String    @unique   -- Besu wallet for this tenant
  walletEncryptedKey    String              -- AES-256 encrypted private key
  logoUrl               String?
  primaryColor          String    @default("#6366f1")
  customDomain          String?
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
}

model TenantUser {
  id            String    @id @default(uuid())
  tenantId      String
  email         String
  passwordHash  String
  name          String
  role          Role      @default(MEMBER)  -- ADMIN | MEMBER | VIEWER
  authProvider  String    @default("credentials")
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?
  @@unique([tenantId, email])
}

model AuditLog {
  id        String   @id @default(uuid())
  tenantId  String
  actorId   String
  action    String   -- "CERTIFICATE_ISSUED" | "CERTIFICATE_REVOKED" | etc.
  targetId  String?
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
}

PER-TENANT SCHEMA (dynamically created on tenant registration):

model Certificate {
  id               String    @id @default(uuid())
  recipientName    String
  recipientEmail   String
  courseName       String
  issueDate        DateTime
  expiryDate       DateTime?
  certificateHash  String    @unique   -- keccak256 hex
  txHash           String?             -- Besu transaction hash
  blockNumber      BigInt?
  localPdfPath     String?             -- ./storage/certificates/{tenant}/{id}.pdf
  status           CertStatus @default(PENDING)  -- PENDING|ISSUED|REVOKED|FAILED
  metadata         Json?
  templateId       String?
  batchId          String?
  issuedById       String
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Template {
  id           String   @id @default(uuid())
  name         String
  htmlContent  String   -- Handlebars HTML template string
  thumbnailUrl String?
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
}

model IssuanceBatch {
  id          String      @id @default(uuid())
  name        String
  status      BatchStatus -- PENDING|PROCESSING|COMPLETED|PARTIAL_FAIL
  totalCount  Int
  processed   Int         @default(0)
  failed      Int         @default(0)
  csvPath     String?
  createdAt   DateTime    @default(now())
  completedAt DateTime?
}

Implement a Prisma middleware in lib/prisma.ts:
- getTenantPrisma(tenantSlug: string): returns a Prisma client with
  search_path set to that tenant's schema via $executeRaw
- runMigrationForTenant(tenantSlug: string): creates schema + runs
  tenant-specific table creation SQL on new tenant registration

═══════════════════════════════════════════════
 ETHERS.JS INTEGRATION (lib/ethers.ts + lib/contract.ts)
═══════════════════════════════════════════════

lib/ethers.ts:
  - Create a JsonRpcProvider connected to Besu: process.env.BESU_RPC_URL
  - Export: getProvider() → JsonRpcProvider
  - Export: getTenantSigner(encryptedKey: string) → Wallet
    (decrypt AES-256 key, return ethers.Wallet connected to provider)
  - Export: getPlatformSigner() → Wallet (platform admin wallet)

lib/contract.ts:
  - Import ABI from contracts/artifacts
  - Export: getCertificateRegistry(signerOrProvider) → Contract instance
  - Export: issueCertificateOnChain({
      tenantSlug, hash, recipientId, courseId, expiresAt, encryptedKey
    }) → Promise<{ txHash, blockNumber }>
  - Export: revokeCertificateOnChain({ hash, encryptedKey }) → Promise<txHash>
  - Export: verifyCertificateOnChain(hash) → Promise<{ record, isValid }>
  - Implement retry: 3 attempts with exponential backoff on RPC errors
  - Listen to CertificateIssued events and update DB via Prisma

lib/hash.ts:
  - generateCertificateHash(data: {
      recipientName, recipientEmail, courseName,
      issueDate, tenantId, uuid
    }) → string (keccak256 using ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(data))))
  - This hash is both stored on-chain and embedded in the PDF

═══════════════════════════════════════════════
 PDF GENERATION — LOCAL FILESYSTEM
═══════════════════════════════════════════════

lib/pdf.ts — implement generateAndSaveCertificatePDF():

FUNCTION SIGNATURE:
  generateAndSaveCertificatePDF({
    certificateId: string,
    tenantSlug: string,
    templateHtml: string,       -- Handlebars HTML template
    data: {
      recipientName: string,
      courseName: string,
      issueDate: string,
      expiryDate?: string,
      certificateHash: string,
      tenantName: string,
      tenantLogoUrl?: string,
      verificationUrl: string,  -- https://domain.com/verify/{hash}
    }
  }) => Promise<{ localPath: string, filename: string }>

IMPLEMENTATION STEPS:
  1. Compile Handlebars template with data object
  2. Launch Puppeteer (headless: true, args: ['--no-sandbox'])
  3. Set page content to compiled HTML
  4. Wait for networkidle0
  5. Generate QR code SVG for verificationUrl using 'qrcode' npm package
     and inject it into the HTML before rendering
  6. Print to PDF with options:
       format: 'A4'
       printBackground: true
       margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  7. Close browser
  8. Ensure directory exists: ./storage/certificates/{tenantSlug}/
  9. Save PDF buffer to: ./storage/certificates/{tenantSlug}/{certificateId}.pdf
  10. Return { localPath, filename }

API ROUTE — app/api/certificates/[id]/download/route.ts:
  - Authenticate request (valid JWT)
  - Verify certificate belongs to requesting tenant
  - Read file from localPdfPath using fs.readFileSync
  - Return NextResponse with headers:
      Content-Type: application/pdf
      Content-Disposition: attachment; filename="{recipientName}-certificate.pdf"

═══════════════════════════════════════════════
 NEXTAUTH.js v5 — MULTI-TENANT AUTH
═══════════════════════════════════════════════

Implement NextAuth with:

PROVIDERS:
  CredentialsProvider:
    - Resolve tenant from request subdomain or email domain
    - Lookup TenantUser by email + tenantId
    - bcrypt compare password
    - Return { id, email, name, role, tenantId, tenantSlug }

SESSION STRATEGY: JWT
JWT CALLBACK:
  - Embed tenantId, tenantSlug, role into token

SESSION CALLBACK:
  - Expose tenantId, tenantSlug, role on session.user

MIDDLEWARE (middleware.ts):
  - Protect all /dashboard/* and /api/* routes
  - Allow /verify/*, /auth/*, and / without auth
  - Redirect unauthenticated to /login

TENANT RESOLUTION (lib/tenant.ts):
  resolveTenatFromRequest(req: NextRequest):
    1. Check subdomain: {slug}.platform.com
    2. Fallback: X-Tenant-Slug header
    3. Fallback: JWT claim tenantSlug
    4. Validate tenant is active in DB
    Returns: Tenant object or 401

═══════════════════════════════════════════════
 API ROUTES — IMPLEMENTATION DETAILS
═══════════════════════════════════════════════

POST /api/certificates (Issue single certificate):
  1. Authenticate + resolve tenant
  2. Validate body: { recipientName, recipientEmail, courseName, 
                      issueDate, expiryDate?, templateId?, metadata? }
  3. Generate UUID for certificate
  4. Compute certificateHash using lib/hash.ts
  5. Create DB record with status=PENDING
  6. Add job to BullMQ 'certificate-issuance' queue with all data
  7. Return 202 { certificateId, status: 'PENDING' }

BullMQ Worker (workers/certificate.worker.ts) processes each job:
  Step 1: Fetch template HTML from DB (or use default)
  Step 2: Call generateAndSaveCertificatePDF() → get localPath
  Step 3: Update DB: localPdfPath = localPath
  Step 4: Call issueCertificateOnChain() → get txHash, blockNumber
  Step 5: Update DB: status=ISSUED, txHash, blockNumber
  Step 6: Send email via Nodemailer with:
            - Certificate PDF as attachment (read from localPath)
            - Verification link: {domain}/verify/{hash}
  Step 7: Write AuditLog entry
  On error: Update DB status=FAILED, log error, retry up to 3x

GET /api/certificates (List):
  - Auth + tenant isolation
  - Query params: page, limit, status, search, dateFrom, dateTo
  - Return paginated list with total count

GET /api/certificates/[id] (Detail):
  - Auth + tenant isolation
  - Return certificate + call verifyCertificateOnChain for live chain status

DELETE /api/certificates/[id]/revoke:
  - Auth + ADMIN role required
  - Call revokeCertificateOnChain()
  - Update DB status=REVOKED
  - Write AuditLog

POST /api/certificates/batch:
  - Accept multipart/form-data with CSV file
  - Parse CSV (columns: recipientName, recipientEmail, courseName, 
                         issueDate, expiryDate)
  - Create IssuanceBatch record
  - Queue individual jobs for each row referencing batchId
  - Return { batchId, totalCount }

GET /api/verify/[hash] (PUBLIC — no auth):
  1. Call verifyCertificateOnChain(hash) via Ethers.js
  2. If found on-chain, also fetch from DB for display metadata
  3. Return:
     {
       isValid: boolean,
       onChain: { txHash, blockNumber, issuedAt, tenantId },
       certificate: { recipientName, courseName, issueDate, tenantName } | null,
       reason?: "NOT_FOUND" | "REVOKED" | "EXPIRED"
     }

POST /api/tenant/register:
  1. Validate: { orgName, slug, adminEmail, adminPassword }
  2. Check slug uniqueness
  3. Generate Besu wallet: ethers.Wallet.createRandom()
  4. Encrypt private key with AES-256 (key from MASTER_ENCRYPTION_KEY env)
  5. Create Tenant record in public schema
  6. Create TenantUser (ADMIN role) in public schema
  7. Create PostgreSQL schema for tenant: CREATE SCHEMA {slug}
  8. Run tenant table migrations in new schema
  9. Call addIssuer(walletAddress, tenantId) on smart contract (platform signer)
  10. Return { tenantId, slug, walletAddress }

═══════════════════════════════════════════════
 FRONTEND — NEXT.JS PAGES
═══════════════════════════════════════════════

app/(public)/verify/[hash]/page.tsx:
  - Server component: fetch /api/verify/[hash] at render time
  - Display:
      Large VALID ✅ or INVALID ❌ / REVOKED 🚫 badge
      Recipient Name, Course Name, Issue Date, Expiry Date
      Issuing Organization name
      Certificate Hash (monospace, truncated with copy button)
      Blockchain TX Hash with link to Besu block explorer
      Block Number, Timestamp
      "This certificate was independently verified on the blockchain"
  - QR code of current URL for sharing

app/(dashboard)/issue/page.tsx:
  - Client component form (react-hook-form + zod validation)
  - Fields: Recipient Name, Email, Course Name, Issue Date,
            Expiry Date (optional), Template selector, Extra Metadata (JSON)
  - On submit: POST /api/certificates → show pending status
  - Poll /api/certificates/:id every 3s until status = ISSUED or FAILED
  - On ISSUED: show success with TX hash + download PDF button

app/(dashboard)/batch/page.tsx:
  - CSV file upload (drag and drop)
  - Show CSV preview table (first 5 rows)
  - Download CSV template button
  - Progress bar polling batch status every 5s
  - Show per-row status (processed / failed count)

app/(dashboard)/certificates/page.tsx:
  - Data table (TanStack Table) with columns:
    Recipient, Course, Issue Date, Status badge, TX Hash (truncated),
    Actions (View, Download PDF, Revoke)
  - Server-side pagination + search + filter by status/date

app/(dashboard)/templates/page.tsx:
  - Split view: left = Handlebars HTML editor (CodeMirror),
    right = live preview iframe rendering compiled template
  - Variable reference panel showing available {{variables}}
  - Save template, set as default

app/(dashboard)/settings/page.tsx:
  - Tenant branding: name, logo upload, primary color
  - Wallet info: address, ETH balance (fetched from Besu), 
    transaction count
  - SMTP configuration for tenant email
  - Danger zone: deactivate tenant

═══════════════════════════════════════════════
 ENVIRONMENT VARIABLES (.env.example)
═══════════════════════════════════════════════

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/certplatform"

# Blockchain
BESU_RPC_URL="http://localhost:8545"
BESU_CHAIN_ID="1337"
CONTRACT_ADDRESS="0x..."
PLATFORM_WALLET_PRIVATE_KEY="0x..."

# Encryption
MASTER_ENCRYPTION_KEY="32-byte-hex-key"

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# PDF Storage
PDF_STORAGE_PATH="./storage/certificates"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@certplatform.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BESU_EXPLORER_URL="http://localhost:4000"

═══════════════════════════════════════════════
 DOCKER COMPOSE
═══════════════════════════════════════════════

version: '3.8'
services:

  postgres:
    image: postgres:16-alpine
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes: postgres_data:/var/lib/postgresql/data
    ports: 5432

  redis:
    image: redis:7-alpine
    ports: 6379

  besu-bootnode:
    image: hyperledger/besu:latest
    command: --genesis-file=/config/genesis.json --rpc-http-enabled ...
    volumes: ./besu-network:/config

  besu-validator-1 through besu-validator-4:
    image: hyperledger/besu:latest
    (QBFT validator node config)

  app:
    build: .
    environment: (all env vars)
    volumes:
      - ./storage:/app/storage    # Mount local PDF storage
    ports: 3000
    depends_on: postgres, redis, besu-validator-1

  worker:
    build: .
    command: node workers/certificate.worker.js
    environment: (all env vars)
    volumes:
      - ./storage:/app/storage    # Same volume as app
    depends_on: postgres, redis, besu-validator-1

  blockscout:
    (Besu block explorer, optional)
    ports: 4000

volumes:
  postgres_data:

═══════════════════════════════════════════════
 DELIVERABLES — COMPLETE IMPLEMENTATION
═══════════════════════════════════════════════

Produce complete, working code for ALL of the following.
No placeholder comments. No TODO stubs. Full implementation only.

  [ ] contracts/CertificateRegistry.sol          (complete Solidity)
  [ ] contracts/test/CertificateRegistry.test.ts (full Hardhat test suite)
  [ ] contracts/scripts/deploy.ts
  [ ] lib/prisma.ts                              (tenant schema switcher)
  [ ] lib/ethers.ts                              (provider + signer)
  [ ] lib/contract.ts                            (all on-chain functions)
  [ ] lib/hash.ts                                (keccak256 utility)
  [ ] lib/pdf.ts                                 (Puppeteer → local save)
  [ ] lib/mailer.ts                              (Nodemailer)
  [ ] lib/tenant.ts                              (tenant resolution)
  [ ] lib/queue.ts                               (BullMQ setup)
  [ ] workers/certificate.worker.ts              (full job processor)
  [ ] prisma/schema.prisma                       (all models)
  [ ] app/api/certificates/route.ts
  [ ] app/api/certificates/[id]/route.ts
  [ ] app/api/certificates/[id]/download/route.ts
  [ ] app/api/certificates/batch/route.ts
  [ ] app/api/verify/[hash]/route.ts
  [ ] app/api/tenant/register/route.ts
  [ ] app/auth.ts                                (NextAuth v5 config)
  [ ] middleware.ts                              (route protection)
  [ ] app/(public)/verify/[hash]/page.tsx
  [ ] app/(dashboard)/issue/page.tsx
  [ ] app/(dashboard)/batch/page.tsx
  [ ] app/(dashboard)/certificates/page.tsx
  [ ] app/(dashboard)/certificates/[id]/page.tsx
  [ ] app/(dashboard)/templates/page.tsx
  [ ] app/(dashboard)/settings/page.tsx
  [ ] besu-network/genesis.json
  [ ] besu-network/docker-compose.besu.yml
  [ ] docker-compose.yml
  [ ] .env.example
  [ ] README.md (setup instructions + architecture diagram)



  amek sure thaaat it must support the full multi tenenat mode perfectly and flexable until finale  prototype borns , thaaat means later if i wanted to  add any new feature it should be easy to  implemnet for you , 
  you can ask me any clarification questions if needed


  instead of docker install the postgress sql 

  eb2a5484a023

  bMIO+yuShHF1fQar