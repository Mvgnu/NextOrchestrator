# MARS Next - Multi-Agent Recursive System

A next-generation platform for AI agent collaboration, enabling multiple AI models to work together for enhanced problem solving.

## Overview

MARS Next is built on the concept of recursive simplicity - one input, many minds, one coherent output. The application allows users to create projects, configure multiple AI agents with different personalities and models, and have them collaborate to produce high-quality synthesized responses.

## Core Architecture

- **Framework**: Next.js 14+ with App Router and Server Actions
- **UI**: TailwindCSS + shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: Supabase / PostgreSQL
- **Storage**: Local or Supabase buckets
- **AI Providers**:
  - OpenAI
  - Anthropic
  - Google Gemini
  - xAI (Grok)
  - DeepSeek

## Key Features

1. **Context Management**
   - Upload files or text
   - Automatic digestion to markdown
   - Context persistence per project

2. **Customizable Agents**
   - Create specialized agents
   - Configure model, personality, and tools
   - Optional persistent memory

3. **Multi-Agent Collaboration**
   - Concurrent agent processing
   - Master synthesis of agent outputs
   - Optional review loop for quality control

4. **Project Organization**
   - Create and manage multiple projects
   - Each with dedicated agents and context
   - Export and share capabilities

## Project Structure

```
marsnext/
├── app/               # Next.js App Router
│   ├── api/           # API routes 
│   ├── (auth)/        # Authentication pages
│   ├── projects/      # Project management pages
│   └── [...]/         # Other app routes
├── components/        # React components
│   ├── ui/            # UI components (shadcn)
│   └── [...]/         # App-specific components
├── lib/               # Utility functions
│   ├── utils.ts       # General utilities
│   ├── supabase.ts    # Supabase client
│   └── [...]/         # Other utilities
└── public/            # Static assets
```

## Development Principles

1. **Recursive Simplicity**: one input, many minds, one signal
2. **Agent Modularity**: agents are tools, not characters
3. **Speed-first**: all actions concurrent; cache intelligently
4. **Zero friction**: minimal UI, instant feedback, no bloated config
5. **Resonance over optimization**: structure follows cognition, not UX trend

## Getting Started

1. **Setup**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with the following:
   ```
   # Database (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Authentication
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # AI API Keys (Optional - users can provide their own)
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GOOGLE_API_KEY=your_google_ai_key
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Build**
   ```bash
   npm run build
   npm start
   ```

## Feature Roadmap

**Phase 1 (Alpha)**
- Context parsing
- Chat agents
- Master synthesis

**Phase 2 (Beta)**
- Review loop
- Reusable agents
- Model chooser

**Phase 3 (v1.0)**
- Team collaboration
- Export/share output
- Memory dashboard

**Future Phases**
- Plugin system (tools per agent)
- Fine-tuned agents
- Agent simulation
- Timeline view
- Live auto-sync context
- Mobile app 