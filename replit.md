# CQFD Formation - CRM for Training Management

## Overview

CQFD Formation is a specialized CRM (Customer Relationship Management) system designed for training organizations in France. The central concept is the **MISSION** - a complete training delivery that encompasses clients, participants, trainers, documents, invoices, and attendance tracking.

The application serves three user roles:
- **Administrator (CQFD)**: Full access to create/manage users, missions, clients, and system settings
- **Formateur (Employee Trainer)**: Access only to assigned missions, can complete steps and upload documents
- **Prestataire (Independent Contractor)**: Same as formateur, with additional SIRET number for invoicing

Key features include mission lifecycle management, participant tracking, attendance/signature recording, document generation from templates, invoice management, automated reminder notifications, and daily Excel exports of planning data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (CSS variables)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Authentication**: Passport.js with local strategy (email/password)
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **Password Security**: bcrypt with 12 salt rounds
- **File Uploads**: Multer with disk storage

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit (`npm run db:push`)

### API Design
- **Pattern**: REST API with typed routes defined in `shared/routes.ts`
- **Validation**: Zod schemas for request/response validation
- **Authorization**: Role-based access control (RBAC) middleware in `server/middleware/rbac.ts`

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks (use-auth, use-missions, etc.)
│   ├── pages/           # Route components
│   └── lib/             # Utilities (queryClient, utils)
├── server/              # Express backend
│   ├── auth/            # Authentication logic
│   ├── middleware/      # RBAC and other middleware
│   └── routes.ts        # API route handlers
├── shared/              # Shared code between client/server
│   ├── schema.ts        # Drizzle database schema
│   ├── routes.ts        # API route definitions with Zod schemas
│   └── models/          # TypeScript type definitions
└── migrations/          # Database migrations
```

### Key Design Decisions
1. **Mission-centric data model**: All operational data (participants, sessions, documents, invoices) is linked to missions
2. **Shared schema**: Database types are shared with frontend for type safety
3. **Role-based UI**: Navigation and features adapt based on user role
4. **Document templates**: Reusable document templates with version control for training materials
5. **Automatic Excel exports**: Daily Excel extraction at 6:00 AM with missions, participants, sessions, invoices and statistics (files kept for 7 days)

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Session storage**: PostgreSQL-backed sessions via connect-pg-simple

### Email Service
- **Nodemailer**: Email sending for notifications and reminders
- **Configuration**: SMTP settings via environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- **Development mode**: Logs emails to console when SMTP is not configured

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email configuration (optional)

### Key npm Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `passport` / `passport-local`: Authentication
- `bcrypt`: Password hashing
- `nodemailer`: Email sending
- `multer`: File upload handling
- `date-fns`: Date formatting (French locale)
- `zod`: Schema validation