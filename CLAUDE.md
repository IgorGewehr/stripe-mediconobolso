# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medical practice management system built with Next.js, integrating Stripe for payments, Firebase for data storage, and OpenAI for AI-powered features. The system provides comprehensive patient management, prescription handling, appointment scheduling, and advanced analytics for medical professionals.

## Development Commands

```bash

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Stripe webhook testing (development)
stripe listen --forward-to localhost:3000/api/webhooks
STRIPE_WEBHOOK_SECRET=$(stripe listen --print-secret) npm run dev
```

## Architecture Overview

### Core Structure
- **Next.js 15** with App Router architecture
- **Firebase** for authentication, Firestore for database, and Storage for files
- **Stripe** for subscription management and payments
- **Material-UI** for UI components with custom theming
- **OpenAI** integration for AI-powered medical analysis

### Key Directories

#### `/app` - Next.js App Router
- **`/api`** - 16 API routes handling subscriptions, emails, medical chat, webhooks, etc.
- **`/components`** - Organized modular structure:
  - `ui/` - Reusable UI elements (buttons, cards, inputs)
  - `features/` - Feature-specific components by domain (patients, prescriptions, appointments, etc.)
  - `providers/` - Context providers (Auth, Theme)
  - `hooks/` - Custom React hooks
  - `layout/` - Layout components (Sidebar, TopAppBar, ProtectedRoute)
  - `templates/` - Page templates (Dashboard, Patient, etc.)

#### `/lib` - Core Services
- **`config/`** - Configuration files (firebase.config.js, stripe.js)
- **`services/firebase/`** - Domain-specific Firebase services:
  - `base.service.js` - Base service class with shared utilities
  - `auth.service.js` - Authentication operations
  - `patients.service.js` - Patient management
  - `prescriptions.service.js` - Prescription handling
  - `appointments.service.js` - Appointment scheduling
  - `exams.service.js` - Exam management
  - `notes.service.js` - Medical notes
  - `secretary.service.js` - Secretary account management
  - `admin.service.js` - Admin operations
  - `ai.service.js` - AI-powered features
  - `weather.service.js` - Weather data
  - `storage.service.js` - File storage
- **`utils/`** - Utility functions (date, validation, format)
- **`models/`** - Data models
- **`firebaseService.js`** - Legacy facade (delegates to domain services)
- **`moduleConfig.js`** - Module system configuration
- **`emailService.js`** - Email functionality

### Module System Architecture

The application uses a sophisticated module system defined in `lib/moduleConfig.js` that controls feature access based on subscription plans:

- **Free Plan**: Basic features (dashboard, limited patients, prescriptions, appointments)
- **Monthly Plan**: Includes AI analysis and exam processing
- **Annual Plan**: Adds bulk operations, advanced reports, and integrations
- **Enterprise Plan**: Full access to all modules including admin features

Each module has dependencies and limitations that are enforced throughout the application.

### Authentication & Authorization
- Firebase Auth for user authentication
- Module-based access control using `useModuleAccess` hook
- Protected routes via `ModuleProtection` component
- Session management with `authProvider.jsx`

### Key Features
- **Patient Management**: Complete patient records with medical history
- **Prescription System**: Digital prescription creation and management
- **Appointment Scheduling**: Calendar-based appointment system
- **AI Medical Analysis**: OpenAI integration for medical document analysis
- **Exam Processing**: Automated exam document processing with OCR
- **Subscription Management**: Stripe-based subscription handling
- **Real-time Updates**: Firebase real-time database for live updates
- **Mobile Support**: Responsive design with mobile-specific components

## Configuration Notes

### Environment Variables Required
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for webhook verification
- Firebase configuration is directly in `lib/firebase.js` (consider moving to env vars)
- OpenAI API key for AI features

### Next.js Configuration
- **Output**: Standalone build for deployment
- **Server Actions**: 10MB body size limit for file uploads
- **Webpack**: External packages configured for server-side rendering
- **Performance**: Increased limits for large file processing

### Firebase Structure
- **Authentication**: User management and sessions
- **Firestore**: Document-based data storage
- **Storage**: File uploads and document storage
- **Realtime Database**: Live updates and presence tracking

## Development Patterns

### Component Organization
- Use the modular component structure:
  - `ui/` for reusable UI elements
  - `features/` for domain-specific components
  - `templates/` for page-level components
- Import from barrel exports when possible (e.g., `import { PatientCard } from '@/features'`)
- Path aliases configured in tsconfig.json (@/components, @/lib, @/services, etc.)
- Follow Material-UI theming patterns
- Implement proper loading states and error handling

### Data Flow
- Firebase for persistent data storage
- Real-time updates using Firebase listeners
- Client-side state management with React hooks
- Module-based feature gating

### API Design
- RESTful API routes in `/app/api`
- Proper error handling and validation
- Stripe webhook handling for subscription events
- OpenAI integration for medical analysis

## Deployment

This project is configured for Netlify deployment with:
- Standalone Next.js build
- Server-side rendering support
- Automatic deployment via `netlify.toml`
- Environment variable management through Netlify

## Key Integrations

- **Stripe**: Payment processing and subscription management
- **Firebase**: Complete backend-as-a-service
- **OpenAI**: AI-powered medical analysis and chat
- **Material-UI**: Comprehensive UI component library
- **Framer Motion**: Animation library for smooth transitions
- **PDF Processing**: jsPDF and pdf-lib for document generation
- **OCR**: Tesseract.js for document text extraction