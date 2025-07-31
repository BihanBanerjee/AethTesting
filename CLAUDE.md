# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aetheria is an AI-powered platform that brings intelligent context to GitHub repositories. It combines vector search capabilities with commit analysis and meeting summarization to help development teams understand, navigate, and collaborate on their codebase more effectively.

**Package Manager**: The project uses npm commands locally but `bun` for deployment (see vercel.json). npm scripts are the standard interface regardless of package manager used.

## Development Commands

### Core Development
- `npm run dev` - Start development server (uses Next.js with Turbo)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run both linting and type checking
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Format code with Prettier

### Database Management
- `npm run db:generate` - Generate Prisma client and run migrations (development)
- `npm run db:migrate` - Deploy database migrations (production)
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:studio` - Open Prisma Studio for database exploration
- `./start-database.sh` - Start local PostgreSQL container with vector extensions (Docker/Podman)

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: tRPC for type-safe API, Prisma ORM
- **Database**: PostgreSQL with vector extensions for embeddings
- **AI**: Google Gemini for code analysis and meeting summarization
- **Auth**: Clerk for user authentication
- **Payments**: Stripe for credit purchases
- **File Storage**: Firebase for meeting recordings
- **Styling**: Tailwind CSS 4.0 with custom components
- **UI Components**: Radix UI for accessible components, shadcn/ui (New York style)
- **Background Jobs**: Inngest for async processing
- **Animation**: Framer Motion for UI animations
- **3D Graphics**: Three.js for enhanced visual effects

### Key Architecture Patterns

#### tRPC Router Structure
- Located in `src/server/api/routers/`
- Main router in `src/server/api/root.ts`
- Project-related procedures in `src/server/api/routers/project.ts`
- Uses protected procedures for authenticated endpoints

#### Database Schema (Prisma)
- Vector embeddings for code search stored in `SourceCodeEmbedding` model (768-dimensional vectors)
- Credit-based system tracked in `User` model (starts with 150 credits)
- Project lifecycle: INITIALIZING → LOADING_REPO → INDEXING_REPO → POLLING_COMMITS → DEDUCTING_CREDITS → COMPLETED
- Enhanced analytics with `FileAnalytics`, `InteractionAnalytics`, `SuggestionFeedback` models
- Advanced question tracking with intent classification, confidence scoring, and satisfaction ratings
- Code generation analytics with complexity scoring and application rate tracking
- Structured meeting issue extraction and analysis capabilities
- Uses `Unsupported("Vector(768)")` type for PostgreSQL vector extension compatibility

#### AI Integration
- Code analysis using Google Gemini (`src/lib/gemini.ts`)
- Rate limiting implemented for API calls (20 requests/minute)
- Meeting transcription with AssemblyAI (`src/lib/assembly.ts`)
- Vector search for semantic code understanding
- Background job processing with Inngest (`src/lib/inngest/functions.ts`)

### App Structure
- `src/app/(protected)/` - Protected routes requiring authentication
- `src/app/(protected)/dashboard/` - Main dashboard with project overview
- `src/app/(protected)/code-assistant/` - AI-powered code assistant interface
- `src/app/(protected)/qa/` - Q&A interface for saved questions
- `src/app/(protected)/meetings/` - Meeting management and summaries
- `src/app/(protected)/billing/` - Billing and credit management
- `src/components/` - Reusable UI components organized by feature
- `src/components/ui/` - Core UI components including custom dark-themed components
- `src/lib/` - Core libraries and utilities
- `src/server/` - tRPC server setup and API routers
- `src/hooks/` - Custom React hooks

### Key Features Implementation
- **Vector Search**: Embeddings stored in PostgreSQL with vector extension
- **Commit Analysis**: AI-powered diff summarization with GitHub integration
- **Meeting Summaries**: Audio transcription and AI analysis of discussions
- **Credit System**: File indexing costs 1 credit per file, questions are free after indexing
- **Real-time Updates**: Project status tracking with detailed processing logs

### Dashboard Architecture
- **Layout Structure**: 75/25 split with Ask Aetheria taking primary space (75%) and Quick Actions sidebar (25%)
- **Progressive Disclosure**: Files tab shows summaries first with expandable original code sections
- **Response Components**: Tabbed interface (Response, Code, Files) with enhanced readability
- **Modal System**: Full-screen modals for detailed code viewing without height restrictions

### UI Component System
- **Glassmorphic Design**: Custom `.glassmorphism` class with backdrop-filter effects throughout interface
- **Dark Code Blocks**: `DarkCodeBlock` component using react-syntax-highlighter with atomDark theme
- **Custom Markdown**: `DarkMarkdown` component for rendering AI responses with proper dark theme
- **Response Modal**: Streaming dialog with typewriter effects and professional code highlighting
- **File Viewer**: Progressive disclosure pattern showing summaries with expandable syntax-highlighted code
- **shadcn/ui Integration**: Uses shadcn/ui component system with customized New York style
- **Component Variants**: Uses class-variance-authority for consistent component styling patterns

## Development Guidelines

### Database Operations
- Always use Prisma migrations for schema changes
- Vector embeddings are stored as `Unsupported("Vector(768)")` type
- Credits are deducted during the DEDUCTING_CREDITS phase of project processing
- Uses PostgreSQL extensions preview feature for vector support
- Local development uses Docker/Podman containers via `start-database.sh`
- Automatic password generation for security when using default credentials

### AI Integration
- Rate limiting is implemented in `src/lib/gemini.ts` (20 requests/minute)
- All AI operations should handle errors gracefully
- Meeting processing is handled asynchronously through background jobs

### Authentication & Routing
- Uses Clerk for authentication with middleware (`src/middleware.ts`)
- Protected routes are wrapped in `(protected)` folder
- Public routes: `/`, `/sign-in`, `/sign-up`, API webhooks, Inngest endpoints
- User context available through tRPC procedures

### Error Handling & Build Configuration
- ESLint and TypeScript errors are ignored during builds (see next.config.js)
- Always validate user inputs with Zod schemas
- Credit validation occurs before project creation
- Uses modern ESLint flat config with TypeScript integration
- PostCSS configured with Tailwind CSS plugin
- Turbo acceleration enabled for development server

## Environment Variables Required
**Core Required**:
- `DATABASE_URL` - PostgreSQL connection string with vector extension
- `NODE_ENV` - Environment (development/test/production)

**Note**: While many environment variables are referenced in the codebase, only `DATABASE_URL` and `NODE_ENV` are validated in `src/env.js`. Other services may require:
- `GEMINI_API_KEY` - Google Gemini API key for AI operations
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key for meeting transcription
- `GITHUB_TOKEN` - GitHub API token for repository access
- `CLERK_SECRET_KEY` - Clerk authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `STRIPE_SECRET_KEY` - Stripe payments
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase configuration for file storage

## Testing
This project does not currently have a formal test suite. Development relies on:
- TypeScript type checking (`npm run typecheck`)
- ESLint for code quality (`npm run lint`)
- Manual testing through the development server

## Prerequisites & Setup
- **Node.js**: v18+ required
- **PostgreSQL**: Must have vector extension installed (or use `./start-database.sh` for Docker setup)
- **Package Manager**: Can use npm, bun, or pnpm (npm scripts work with any)
- **Container Runtime**: Docker or Podman for local database development
- **API Keys**: Multiple external services required (see Environment Variables section)

### Quick Start
1. Clone repository and install dependencies: `npm install`
2. Set up local database: `./start-database.sh`
3. Run database migrations: `npm run db:generate`
4. Start development server: `npm run dev`

## Development Tools & Configuration

### TypeScript Configuration
- **Strict Mode**: Uses strict TypeScript with `noUncheckedIndexedAccess` for enhanced type safety
- **Modern Modules**: Configured for ESNext modules with bundler resolution
- **Path Aliases**: Single `@/*` alias pointing to `src/*`

### Package Dependencies
- **Service Layer**: Well-structured with `ai-code-service`, `analytics-service`, `meeting-service`
- **LangChain Integration**: Uses community package with special ignore overrides
- **3D Graphics**: Three.js integration for enhanced UI effects
- **Auto-installation**: `postinstall` script runs `prisma generate` automatically

## CLI Initialization Guidance
- This repository uses a custom initialization script for setting up Aetheria projects
- Initialization process standardizes project configuration and prepares development environment