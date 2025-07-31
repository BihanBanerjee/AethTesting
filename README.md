# Aetheria - Context-Aware Repository Intelligence

<div align="center">
  <img src="/public/aetheria-logo.svg" alt="Aetheria Logo" width="120" />
  <h3>Where AI Meets Your Codebase</h3>
</div>

## 🌟 Overview

Aetheria is an AI-powered platform that brings intelligent context to your GitHub repositories. It combines vector search capabilities with commit analysis and meeting summarization to help development teams understand, navigate, and collaborate on their codebase more effectively.

## ✨ Key Features

### 📊 Vector Search for Code

- **Context-Aware Search**: Ask questions about your codebase in natural language
- **Intelligent Code Lookup**: Quickly find relevant files and code snippets
- **Semantic Understanding**: Get answers with precise file references and explanations

### 📝 Commit Analysis

- **AI-Generated Summaries**: Automatically analyze commit diffs for easier understanding
- **Commit History Tracking**: View recent commits with detailed AI explanations
- **Development Insights**: Understand code changes without reading through diffs

### 🎙️ Meeting Summaries

- **Audio Transcription**: Upload meeting recordings in common formats (MP3, WAV, M4A)
- **Discussion Analysis**: AI identifies key points, decisions, and action items
- **Easily Reference Discussions**: Quickly find and reference past technical discussions

### 👥 Team Collaboration

- **Shared Context**: Invite team members to collaborate on projects
- **Knowledge Persistence**: Save questions and answers for future reference
- **Streamlined Onboarding**: Help new developers understand the codebase quickly

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4.0, Radix UI, shadcn/ui (New York style)
- **Backend**: tRPC for type-safe APIs, Prisma ORM
- **Database**: PostgreSQL with vector extensions for 768-dimensional embeddings
- **AI Integration**: Google Gemini for code analysis, AssemblyAI for transcription
- **Authentication**: Clerk for secure user authentication
- **Payments**: Stripe integration for credit purchases
- **File Storage**: Firebase for meeting recordings
- **Background Jobs**: Inngest for async processing
- **Animation**: Framer Motion for UI animations
- **3D Graphics**: Three.js for enhanced visual effects

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ required
- **PostgreSQL**: Must have vector extension installed
- **Container Runtime**: Docker or Podman (for easy database setup)
- **Package Manager**: npm, bun, or pnpm (npm scripts work with any)
- **GitHub Account**: For repository integration
- **API Keys**: Multiple external services required (see Environment Variables)

### Environment Setup

Create a `.env` file with the following variables:

```env
# Core Required (validated in src/env.js)
DATABASE_URL="postgresql://username:password@localhost:5432/aetheria"
NODE_ENV="development"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# External Services
GITHUB_TOKEN=your_github_personal_access_token
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aetheria.git
cd aetheria

# Install dependencies
npm install

# Set up local PostgreSQL database (with vector extensions)
./start-database.sh

# Generate Prisma client and run migrations
npm run db:generate

# Start the development server
npm run dev
```

### Alternative Database Setup

If you prefer to use your own PostgreSQL instance:

1. Ensure PostgreSQL has the vector extension installed
2. Update `DATABASE_URL` in your `.env` file
3. Run `npm run db:push` to push the schema to your database

## 💻 Usage

1. **Sign Up**: Create an account or sign in
2. **Create a Project**: Link your GitHub repository to Aetheria
3. **Ask Questions**: Use the Q&A feature to ask about your codebase
4. **Upload Meetings**: Add meeting recordings for AI analysis
5. **View Commits**: Explore commit history with AI-generated summaries

## 📊 Credit System

Aetheria uses a credit-based system:
- Each file indexed from a repository consumes 1 credit
- New accounts start with 150 free credits
- Additional credits can be purchased through the billing page
- Ask unlimited questions once files are indexed (no additional credit cost)

## 🔗 Project Structure

```
src/
  ├── app/                   # Next.js App Router
  │   ├── (protected)/       # Protected routes requiring authentication
  │   │   ├── dashboard/     # Main dashboard with project overview
  │   │   ├── code-assistant/# AI-powered code assistant interface
  │   │   ├── qa/            # Q&A interface for saved questions
  │   │   ├── meetings/      # Meeting management and summaries
  │   │   └── billing/       # Billing and credit management
  │   └── api/               # API routes (tRPC, webhooks, Inngest)
  ├── components/            # Reusable UI components organized by feature
  │   ├── ui/                # Core UI components (shadcn/ui based)
  │   ├── analytics/         # Analytics dashboards
  │   ├── code-assistant/    # Code assistant specific components
  │   └── landing/           # Landing page components
  ├── lib/                   # Core libraries and utilities
  ├── server/                # tRPC server setup and API routers
  ├── hooks/                 # Custom React hooks
  ├── styles/                # Global styles and themes
  └── middleware.ts          # Clerk authentication middleware
prisma/                      # Database schema and migrations
public/                      # Static assets
start-database.sh           # Local PostgreSQL setup script
```

## 🚀 Development Workflow

### Available Commands

**Core Development:**
- `npm run dev` - Start development server with Turbo acceleration
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

**Code Quality:**
- `npm run lint` / `npm run lint:fix` - ESLint with auto-fix
- `npm run typecheck` - TypeScript type checking
- `npm run check` - Combined linting and type checking
- `npm run format:check` / `npm run format:write` - Prettier formatting

**Database Management:**
- `npm run db:generate` - Generate Prisma client and run migrations (development)
- `npm run db:migrate` - Deploy database migrations (production)
- `npm run db:push` - Push schema changes (development)
- `npm run db:studio` - Open Prisma Studio for database exploration

### Development Best Practices

- **Type Safety**: Uses strict TypeScript with `noUncheckedIndexedAccess`
- **Code Quality**: ESLint and Prettier enforce consistent coding standards
- **Database**: Always use Prisma migrations for schema changes
- **Authentication**: All protected routes use Clerk middleware
- **AI Integration**: Rate limiting implemented (20 requests/minute for Gemini)
- **Error Handling**: Validate inputs with Zod schemas

### Project Lifecycle

Projects go through these states:
1. **INITIALIZING** - Setting up project structure
2. **LOADING_REPO** - Fetching repository data
3. **INDEXING_REPO** - Creating vector embeddings (1 credit per file)
4. **POLLING_COMMITS** - Monitoring for new commits
5. **DEDUCTING_CREDITS** - Processing credit transactions
6. **COMPLETED** - Ready for Q&A and analysis

## 📸 Screenshots

<div align="center">
  <img src="public/images/dashboard.png" alt="Dashboard" width="45%" />
  <img src="public/images/codeAnalysis.png" alt="Q&A Interface" width="45%" />
</div>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

If you have any questions or feedback, please reach out to us at support@aetheria.ai