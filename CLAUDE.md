# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aetheria is an AI-powered platform that brings intelligent context to GitHub repositories. It combines vector search capabilities with commit analysis and meeting summarization to help development teams understand, navigate, and collaborate on their codebase more effectively.

**Package Manager**: The project uses npm commands but README mentions `bun` - npm scripts are the standard interface regardless of package manager used.

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

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: tRPC for type-safe API, Prisma ORM
- **Database**: PostgreSQL with vector extensions for embeddings
- **AI**: Google Gemini for code analysis and meeting summarization
- **Auth**: Clerk for user authentication
- **Payments**: Stripe for credit purchases
- **File Storage**: Firebase for meeting recordings
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI for accessible components
- **Background Jobs**: Inngest for async processing

### Key Architecture Patterns

#### tRPC Router Structure
- Located in `src/server/api/routers/`
- Main router in `src/server/api/root.ts`
- Project-related procedures in `src/server/api/routers/project.ts`
- Uses protected procedures for authenticated endpoints

#### Database Schema (Prisma)
- Vector embeddings for code search stored in `SourceCodeEmbedding` model
- Credit-based system tracked in `User` model (starts with 150 credits)
- Project lifecycle: INITIALIZING → LOADING_REPO → INDEXING_REPO → POLLING_COMMITS → DEDUCTING_CREDITS → COMPLETED
- Comprehensive analytics tracking with `AiInteraction`, `CodeGeneration`, and `InteractionAnalytics` models

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
- `src/components/` - Reusable UI components organized by feature
- `src/components/ui/` - Core UI components including custom dark-themed components

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

## Development Guidelines

### Database Operations
- Always use Prisma migrations for schema changes
- Vector embeddings are stored as `Unsupported("Vector(768)")` type
- Credits are deducted during the DEDUCTING_CREDITS phase of project processing

### AI Integration
- Rate limiting is implemented in `src/lib/gemini.ts` (20 requests/minute)
- All AI operations should handle errors gracefully
- Meeting processing is handled asynchronously through background jobs

### Authentication & Routing
- Uses Clerk for authentication with middleware (`src/middleware.ts`)
- Protected routes are wrapped in `(protected)` folder
- Public routes: `/`, `/sign-in`, `/sign-up`, API webhooks, Inngest endpoints
- User context available through tRPC procedures

### Error Handling
- ESLint and TypeScript errors are ignored during builds (see next.config.js)
- Always validate user inputs with Zod schemas
- Credit validation occurs before project creation

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string with vector extension
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
- **PostgreSQL**: Must have vector extension installed
- **Package Manager**: Can use npm, bun, or pnpm (npm scripts work with any)
- **API Keys**: Multiple external services required (see Environment Variables section)

## CLI Initialization Guidance
- This repository uses a custom initialization script for setting up Aetheria projects
- Initialization process standardizes project configuration and prepares development environment