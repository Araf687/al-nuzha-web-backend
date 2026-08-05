# CoolDesk API — NestJS Backend

**AC & Refrigerator Service Management System — Dubai**

A complete REST API for managing air conditioning and refrigerator service requests, technician assignments, job reporting, parts inventory, invoicing, and customer reviews.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Core Workflows](#core-workflows)
- [Data Models](#data-models)
- [Modules Overview](#modules-overview)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Database](#database)
- [Authentication](#authentication)
- [Common Tasks](#common-tasks)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 10 |
| **Language** | TypeScript 5.1 |
| **Database** | PostgreSQL + TypeORM 0.3 |
| **Authentication** | JWT (Passport) |
| **Validation** | class-validator + class-transformer |
| **API Docs** | Swagger/OpenAPI |
| **Password Security** | bcrypt |
| **HTTP Server** | Express.js |

---

## 🏗️ Project Architecture

### Folder Structure
```
src/
├── app.module.ts              # Root module (all imports)
├── main.ts                    # Application bootstrap
├── auth/                      # Login, JWT strategy
├── customers/                 # Customer entity & CRUD
├── technicians/               # Technician/staff entity & CRUD
├── service-requests/          # Job requests (guest or registered)
├── job-reports/               # Technician field reports (auto-invoice)
├── parts/                     # Parts catalogue & inventory
├── invoices/                  # Billing & payment tracking
├── services-catalogue/        # Services offered (public)
├── reviews/                   # Customer feedback
├── notifications/             # Notification log
└── common/
    └── guards/
        └── jwt-auth.guard.ts  # JWT middleware
```

### Request Flow Diagram

```
1. GUEST or REGISTERED CUSTOMER
   └─> POST /service-requests
       └─> Creates ServiceRequest (status: pending)

2. ADMIN/SYSTEM
   └─> PATCH /service-requests/:id/assign
       └─> Links Technician
       └─> Updates status to "assigned"

3. TECHNICIAN (in field)
   └─> POST /job-reports/service-request/:srId
       └─> Submits completed job + parts + expenses
       └─> Auto-deducts parts from inventory
       └─> Auto-generates Invoice
       └─> Updates ServiceRequest status to "completed"

3b. TECHNICIAN (direct customer call)
   └─> POST /job-reports/instant
       └─> Creates ServiceRequest from the same form
       └─> Auto-assigns logged-in technician
       └─> Submits completed job + parts + expenses
       └─> Auto-generates Invoice
       └─> Marks ServiceRequest as "completed"

4. CUSTOMER
   ├─> GET /invoices/my-invoices
   ├─> PATCH /invoices/:id/mark-paid
   └─> POST /reviews (rate & comment)
```

---

## 🔄 Core Workflows

### 1. **Service Request Workflow**
**Responsible:** `ServiceRequestsModule`

| Step | Action | Status | Actor |
|------|--------|--------|-------|
| 1 | Customer/guest submits request | `PENDING` | Customer |
| 2 | Admin assigns technician | `ASSIGNED` | Admin |
| 3 | Technician starts job | `IN_PROGRESS` | Technician |
| 4 | Technician submits report | `COMPLETED` | Technician |
| 4b | Technician creates instant phone-call job and submits in one form | `COMPLETED` | Technician |
| 5 | Customer views invoice & reviews | — | Customer |

**Key Features:**
- Guest submissions (phone-only) can later register
- Recurring issues from history
- Monthly statistics & dashboard
- Auto-status updates from job reports

---

### 2. **Job Report & Auto-Invoice Workflow**
**Responsible:** `JobReportsModule` + `InvoicesModule`

When a technician submits a job report:

```
POST /job-reports/service-request/:srId
{
  faultFound: "Compressor not working",
  diagnosisNotes: "Needs replacement",
  labourCharge: 150.00,
  parts: [
    { partId: "uuid", quantityUsed: 1 }
  ],
  extraExpenses: [
    { description: "Delivery fee", amount: 20.00 }
  ]
}
```

**Auto-Actions:**
1. Deduct parts from `parts.stockQuantity`
2. Calculate totals:
   - `partsTotal` = sum of used parts
   - `extraExpensesTotal` = sum of extras
   - `vatAmount` = (labourCharge + partsTotal) × 5% (Dubai VAT)
   - `grandTotal` = labourCharge + partsTotal + extraExpensesTotal + VAT
3. Create Invoice with status `PENDING`
4. Update ServiceRequest status to `COMPLETED`
5. Trigger notification to customer

**Instant field-call flow:**
- Technician receives a call directly from a customer
- Technician submits a single form to create the job and complete it in one step
- Backend auto-creates the `ServiceRequest`
- Backend auto-assigns the logged-in technician to that job
- Backend creates the `JobReport`, deducts stock, and generates the invoice

**Instant endpoint example:**

```
POST /job-reports/instant
{
  name: "Sara Mohammed",
  phone: "+971551234567",
  serviceType: "AC Repair",
  problemDescription: "AC stopped blowing cold air during an emergency visit",
  address: "Apartment 5B, JBR, Dubai",
  equipmentType: "AC",
  equipmentBrand: "Samsung",
  equipmentModel: "AR18TYHYEWK",
  faultFound: "Indoor fan motor seized",
  diagnosisNotes: "Technician created the job on-site and completed the repair in one visit",
  labourCharge: 180.00,
  parts: [
    { partId: "uuid", quantity: 1, unitPrice: 85.00 }
  ],
  services: [
    { serviceName: "Emergency visit", labourCost: 90.00 }
  ],
  expenses: [
    { description: "Parking fee", amount: 15.00 }
  ]
}
```

---

### 3. **Parts Inventory Workflow**
**Responsible:** `PartsModule`

**Stock Management:**
- Parts have `costPrice`, `sellingPrice`, `minStockLevel`, `stockQuantity`
- Auto-deduction when used in job reports
- Low-stock alerts (flag parts below `minStockLevel`)
- Technicians can request custom parts (awaiting approval)

**Endpoints:**
- `GET /parts` — All parts (with stock levels)
- `GET /parts/low-stock` — Parts needing restock
- `POST /parts` — Add new part
- `PATCH /parts/:id/restock` — Increase stock
- `PATCH /parts/:id/approve` — Approve custom parts from field

---

### 4. **Invoice & Payment Workflow**
**Responsible:** `InvoicesModule`

**Statuses:**
- `PENDING` — Created from job report, awaiting customer payment
- `PAID` — Mark via `PATCH /invoices/:id/mark-paid`
- `REFUNDED` — (if implemented)

**Features:**
- Auto-generated from job reports
- Customer views own invoices
- Revenue summary (monthly)
- Payment tracking

---

### 5. **Customer & Technician Management**
**Responsible:** `CustomersModule` + `TechniciansModule`

**Customer Types:**
- **Guest**: Phone only, no password (created on first request)
- **Registered**: Phone + email + password hash (bcrypt)

**Technician (Staff):**
- Assigned to service requests
- Submit job reports
- View performance stats
- Request custom parts

---

## 📊 Data Models

### Customer Entity
```typescript
{
  id: UUID;
  name: string;
  phone: string (unique);
  email?: string;
  address?: string;
  lat?, lng?: number;              // Geolocation
  passwordHash?: string;
  isRegistered: boolean;           // Guest = false, Registered = true
  createdAt: Date;
  
  // Relations
  serviceRequests: ServiceRequest[];
  invoices: Invoice[];
  reviews: Review[];
  notifications: Notification[];
}
```

### ServiceRequest Entity
```typescript
{
  id: UUID;
  jobRef: string (unique);         // e.g., JOB-2047
  source: 'phone' | 'website';
  
  // Equipment details
  serviceType: string;
  equipmentType: 'AC' | 'Refrigerator' | 'Freezer';
  equipmentBrand: string;
  equipmentModel: string;
  problemDescription: string;
  
  // Location
  address: string;
  lat?, lng?: number;
  
  // Status
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  
  // Relations
  customer: Customer;
  assignedTechnician?: Technician;
  jobReport?: JobReport (one-to-one);
  createdAt: Date;
}
```

### JobReport Entity
```typescript
{
  id: UUID;
  
  // Field diagnosis
  faultFound: string;
  diagnosisNotes: string;
  
  // Charges
  labourCharge: decimal(10,2);
  partsTotal: decimal(10,2);       // Sum of used parts
  extraExpensesTotal: decimal(10,2);
  vatAmount: decimal(10,2);        // Auto-calculated
  grandTotal: decimal(10,2);       // Auto-calculated
  
  // Signature & timestamps
  customerSignatureUrl?: string;
  arrivedAt?: Date;
  completedAt?: Date;
  
  // Relations
  serviceRequest: ServiceRequest (one-to-one);
  technician: Technician;
  parts: JobPart[];                // Parts used
  services: JobService[];          // Services provided
  expenses: JobExpense[];
  invoice: Invoice (one-to-one);   // Auto-created
  createdAt: Date;
}
```

### Parts Entity
```typescript
{
  id: UUID;
  partName: string;
  partNumber: string (unique);
  category: string;
  
  // Pricing
  costPrice: decimal(10,2);
  sellingPrice: decimal(10,2);
  
  // Inventory
  stockQuantity: number;
  minStockLevel: number;
  
  // Approval (for tech-requested parts)
  isApproved: boolean;
  requestedBy?: Technician;
  approvedBy?: User;
  
  createdAt: Date;
}
```

### Invoice Entity
```typescript
{
  id: UUID;
  invoiceNumber: string (unique);
  
  // Amounts
  labourCharge: decimal(10,2);
  partsTotal: decimal(10,2);
  extraExpensesTotal: decimal(10,2);
  vatAmount: decimal(10,2);
  grandTotal: decimal(10,2);
  
  // Status
  status: 'pending' | 'paid' | 'refunded';
  
  // Relations
  customer: Customer;
  jobReport: JobReport (one-to-one);
  createdAt: Date;
}
```

---

## 📦 Modules Overview

| Module | Responsibility | Key Entities |
|--------|-----------------|--------------|
| **AuthModule** | JWT login for customers & technicians | — |
| **CustomersModule** | Customer CRUD, registration | Customer |
| **TechniciansModule** | Staff management | Technician |
| **ServiceRequestsModule** | Job submission, assignment, status | ServiceRequest |
| **JobReportsModule** | Technician field reports (triggers invoice & stock deduction) | JobReport, JobPart, JobService, JobExpense |
| **PartsModule** | Parts catalogue, inventory, stock management | Part |
| **InvoicesModule** | Billing, payment tracking, revenue analytics | Invoice |
| **ServicesCatalogueModule** | Services offered (public) | ServiceCatalogue |
| **ReviewsModule** | Customer feedback | Review |
| **NotificationsModule** | Notification log | Notification |

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/customer/register      # Register (guest → registered)
POST   /api/v1/auth/customer/login         # Customer login
POST   /api/v1/auth/technician/login       # Technician login
```

### Service Requests (Jobs)
```
POST   /api/v1/service-requests            # Submit new request (guest or registered)
POST   /api/v1/service-requests/:id/recurring  # Report recurring from history [JWT]
GET    /api/v1/service-requests            # All jobs with filters [JWT]
GET    /api/v1/service-requests/my-orders  # Customer's own jobs [Customer JWT]
GET    /api/v1/service-requests/stats/monthly  # Dashboard stats [JWT]
PATCH  /api/v1/service-requests/:id/assign # Assign technician [JWT]
PATCH  /api/v1/service-requests/:id/status # Update status [JWT]
```

### Job Reports (Technician Submissions)
```
POST   /api/v1/job-reports/service-request/:srId  # Submit completed job for an existing request [Tech JWT]
POST   /api/v1/job-reports/instant               # Create + auto-assign + submit in one form [Tech JWT]
GET    /api/v1/job-reports/my-jobs         # Technician's jobs [Tech JWT]
GET    /api/v1/job-reports/staff-performance     # Performance stats [JWT]
GET    /api/v1/job-reports/:id             # Single report [JWT]
```

### Parts & Inventory
```
GET    /api/v1/parts                       # All parts [JWT]
GET    /api/v1/parts/low-stock             # Below min level [JWT]
GET    /api/v1/parts/pending-review        # Awaiting approval [JWT]
POST   /api/v1/parts                       # Add new part [JWT]
PATCH  /api/v1/parts/:id/approve           # Approve custom part [JWT]
PATCH  /api/v1/parts/:id/restock           # Add stock [JWT]
```

### Invoices
```
GET    /api/v1/invoices                    # All invoices (filterable) [JWT]
GET    /api/v1/invoices/my-invoices        # Customer's invoices [Customer JWT]
GET    /api/v1/invoices/revenue-summary    # Monthly revenue [JWT]
PATCH  /api/v1/invoices/:id/mark-paid      # Mark paid [JWT]
```

### Services Catalogue
```
GET    /api/v1/services-catalogue          # Active services [PUBLIC]
```

### Customers
```
GET    /api/v1/customers                   # All customers [JWT]
GET    /api/v1/customers/:id               # Single customer [JWT]
PATCH  /api/v1/customers/:id               # Update customer [JWT]
```

### Technicians
```
GET    /api/v1/technicians                 # All technicians [JWT]
GET    /api/v1/technicians/:id             # Single technician [JWT]
POST   /api/v1/technicians                 # Create technician [JWT]
PATCH  /api/v1/technicians/:id             # Update technician [JWT]
```

### Reviews
```
POST   /api/v1/reviews                     # Create review [Customer JWT]
GET    /api/v1/reviews                     # All reviews [Public]
GET    /api/v1/reviews/service-request/:id # Reviews for a job [Public]
```

### Notifications
```
GET    /api/v1/notifications               # Notification log [JWT]
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (running locally or remote)
- pnpm (or npm)

### 1. Clone & Install
```bash
cd /home/araf/myProject/cooldesk-api
pnpm install
# or: npm install
```

### 2. Environment Configuration
Create `.env` in the root:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=cooldesk

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
JWT_EXPIRY=24h

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### 3. Create Database
```sql
CREATE DATABASE cooldesk;
```

Or via psql:
```bash
psql -U postgres -c "CREATE DATABASE cooldesk;"
```

### 4. Run in Development
```bash
pnpm run start:dev
# or: npm run start:dev
```

TypeORM with `synchronize: true` will auto-create tables on first run.

### 5. Access Swagger Docs
```
http://localhost:3001/api/docs
```

---

## 💻 Development

### Build for Production
```bash
pnpm run build
```

Output: `dist/` folder

### Start Production Server
```bash
pnpm run start:prod
```

### Key Development Patterns

**Module Structure:**
```
feature/
├── feature.controller.ts       # Routes
├── feature.service.ts          # Business logic
├── feature.module.ts           # Module config
├── entities/
│   └── feature.entity.ts       # TypeORM entity
└── dto/
    ├── create-feature.dto.ts   # Request validation
    └── update-feature.dto.ts
```

**Validation:**
- Use `class-validator` decorators on DTOs
- ValidationPipe in `main.ts` enforces them globally
- Auto-transforms request bodies

**Authentication:**
- JWT stored in header: `Authorization: Bearer <token>`
- `JwtAuthGuard` validates all protected routes
- Attach `@UseGuards(JwtAuthGuard)` to protected endpoints

---

## 🗄️ Database

### Auto-Schema Generation
- TypeORM with `synchronize: true` in dev auto-creates tables from entities
- **NEVER enable in production** (risk of data loss)

### Key Relations
```
Customer
├── 1-to-Many → ServiceRequest
├── 1-to-Many → Invoice
├── 1-to-Many → Review
└── 1-to-Many → Notification

ServiceRequest
├── Many-to-One → Customer
├── Many-to-One → Technician (assigned)
└── 1-to-One → JobReport

JobReport
├── 1-to-One → ServiceRequest
├── Many-to-One → Technician
├── 1-to-Many → JobPart (parts used)
├── 1-to-Many → JobService (services billed)
├── 1-to-Many → JobExpense (extras)
└── 1-to-One → Invoice (auto-created)

Part
└── 1-to-Many → JobPart

Invoice
├── Many-to-One → Customer
└── 1-to-One → JobReport
```

---

## 🔐 Authentication

### Customer Registration
```
POST /api/v1/auth/customer/register
{
  "name": "Ahmed Ali",
  "phone": "+971501234567",
  "email": "ahmed@example.com",
  "password": "SecurePass123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": { id, name, phone, email }
}
```

### Customer Login
```
POST /api/v1/auth/customer/login
{
  "phone": "+971501234567",
  "password": "SecurePass123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": { id, name, phone, email }
}
```

### Technician Login
```
POST /api/v1/auth/technician/login
{
  "email": "technician@cooldesk.ae",
  "password": "TechPass123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "technician": { id, name, email }
}
```

### Using Token
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## 📌 Common Tasks

### Add a New API Endpoint
1. Define DTO (request/response validation):
   ```typescript
   // feature/dto/create-feature.dto.ts
   export class CreateFeatureDto {
     @IsString() @IsNotEmpty() name: string;
     @IsNumber() quantity: number;
   }
   ```

2. Extend service:
   ```typescript
   // feature/feature.service.ts
   async createFeature(dto: CreateFeatureDto) {
     const entity = this.repo.create(dto);
     return this.repo.save(entity);
   }
   ```

3. Add controller route:
   ```typescript
   // feature/feature.controller.ts
   @Post()
   @UseGuards(JwtAuthGuard)
   create(@Body() dto: CreateFeatureDto) {
     return this.service.createFeature(dto);
   }
   ```

4. Add to Swagger (in `main.ts`):
   ```typescript
   .addTag('feature', 'Feature management')
   ```

### Add a New Database Entity
1. Create entity file:
   ```typescript
   // feature/entities/feature.entity.ts
   @Entity('features')
   export class Feature {
     @PrimaryGeneratedColumn('uuid') id: string;
     @Column() name: string;
   }
   ```

2. Add to module `TypeOrmModule.forFeature()`:
   ```typescript
   // feature/feature.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([Feature])],
     ...
   })
   ```

3. Inject into service:
   ```typescript
   @InjectRepository(Feature)
   private repo: Repository<Feature>;
   ```

### Update Service Request Status
```typescript
// service-requests/service-requests.service.ts
async updateStatus(id: string, status: RequestStatus) {
  await this.repo.update(id, { status });
  // Auto-trigger notifications
  await this.notificationsService.create(...)
}
```

### Trigger Auto-Invoice from Job Report
```typescript
// job-reports/job-reports.service.ts
async submitJobReport(srId: string, dto: SubmitJobReportDto) {
  const jobReport = this.repo.create({ ...dto, serviceRequest });
  
  // Auto-deduct parts
  for (const part of dto.parts) {
    await this.partsService.deductStock(part.id, part.quantityUsed);
  }
  
  // Auto-create invoice
  const invoice = await this.invoicesService.createFromJobReport(jobReport);
  
  // Update service request status
  await this.serviceRequestsService.updateStatus(srId, 'completed');
}
```

### Instant Technician Job Flow
```typescript
// job-reports/job-reports.service.ts
async submitInstantJob(technicianId: string, dto: SubmitInstantJobDto) {
  // 1. Upsert customer by phone
  // 2. Create ServiceRequest from the same form
  // 3. Auto-assign the logged-in technician
  // 4. Reuse the normal completed-job flow
  // 5. Save JobReport + Invoice and mark request completed
}
```

---

## 📝 Notes for Future Development

- **Error Handling**: Add global exception filters for consistent error responses
- **Logging**: Implement request/response logging middleware
- **Caching**: Add Redis for invoice generation, stock checks
- **Rate Limiting**: Protect APIs from abuse
- **File Uploads**: Implement for signatures, photos
- **Pagination**: Add for large list endpoints
- **Search/Filter**: Advanced filtering on service requests
- **Testing**: Add unit & e2e tests
- **Deployment**: Docker setup, CI/CD pipeline

---

## 📞 Support

For questions about:
- **API Endpoints**: Check Swagger at `/api/docs`
- **Database Schema**: Review entity files in `src/*/entities/`
- **Workflows**: See Core Workflows section above
- **Authentication**: See Authentication section above
- **Development**: See `.instructions.md` skill file

---

**Last Updated:** May 2026

### Reviews
| GET | `/api/v1/reviews` | **Public** | Approved reviews (homepage) |

---

## Key Business Logic

### Job submission flow
When a technician submits a job report (`POST /job-reports/service-request/:id`):
1. Parts stock is auto-deducted from inventory
2. Custom parts are flagged for admin review
3. Bill is calculated: Labour + Parts + Expenses + 5% VAT
4. Invoice is auto-generated and linked to the job
5. Service request status is set to `completed`

When a technician handles a direct customer phone call (`POST /job-reports/instant`):
1. Customer is created or updated by phone number
2. Service request is created immediately from the same payload
3. Logged-in technician is auto-assigned to that request
4. Job report, stock deduction, VAT, and invoice creation run automatically
5. Service request is saved as `completed`

### Recurring requests
A registered customer can report a recurring issue from any completed job. The new request is pre-filled from the parent job and tagged with `isRecurring: true` and `parentJobId`. Dispatchers see a "Recurring" badge on these jobs in the admin panel.

### Inventory alerts
`GET /parts/low-stock` returns all parts where `stockQty <= minStockLevel`. Wire this to your notification service to alert the shop owner.

---

## Project Structure

```
src/
├── main.ts                    # App entry, Swagger setup
├── app.module.ts              # Root module
├── auth/                      # JWT auth, login, register
├── customers/                 # Customer CRUD
├── technicians/               # Technician management
├── service-requests/          # Core job workflow
├── job-reports/               # Field submissions, parts, expenses
├── parts/                     # Parts catalogue & inventory
├── invoices/                  # Billing & payment tracking
├── services-catalogue/        # Services shown on website
├── reviews/                   # Customer reviews
├── notifications/             # Notification log
└── common/
    └── guards/                # JWT auth guard
```
# al-nuzha-web-backend
