# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TIAB (Trapped In A Box) is a personal inventory management system built with Next.js 15, TypeScript, tRPC, and Drizzle ORM. It allows users to organize items in a hierarchical container structure with tagging capabilities.

## Development Commands

### Package Manager
Use `pnpm` for all package management operations.

### Core Development Commands
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm preview` - Build and start production server

### Database Commands
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio

### Code Quality Commands
- `pnpm check` - Run both linting and type checking
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm tc` - Type check with TypeScript
- `pnpm format:check` - Check Prettier formatting
- `pnpm format:write` - Apply Prettier formatting

## Architecture

### Database Schema
The application uses SQLite with Drizzle ORM and follows a hierarchical container model:

- **Users**: Authenticate and own containers/items
- **Containers**: Hierarchical storage units that can contain items or other containers
- **Items**: Physical objects with name, description, count, stored in containers
- **Tags**: Categorization system for items and containers
- **Many-to-many relationships**: Users-Tags, Containers-Tags, Items-Tags

Key schema features:
- Containers use path-based hierarchy with parent relationships
- Recursive CTE view (`containersPathnameView`) generates full pathnames
- Unique constraints ensure no duplicate item names per container
- Soft deletion with `isDeleted` flags

### API Layer
Uses tRPC for type-safe API with routers for:
- `auth` - Authentication operations
- `containers` - Container CRUD and hierarchy management
- `items` - Item management within containers
- `tags` - Tag management and associations

### Frontend Architecture
- **App Router**: Next.js 13+ app directory structure
- **Components**: Reusable UI components in `/src/components/`
- **UI Library**: Custom components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: tRPC React Query for server state

### Repository Pattern
Data access abstracted through repository classes:
- `src/server/repositories/containers.ts`
- `src/server/repositories/items.ts`
- `src/server/repositories/tags.ts`

### Key Application Features
- Hierarchical container organization (tree structure)
- Item inventory tracking with counts
- Tag-based categorization system
- Public/private visibility controls
- Soft deletion for data preservation

## Environment Setup

Required environment variables:
- `DATABASE_URL` - SQLite database connection string

## Development Guidelines

When working with this codebase:
- Follow the established repository pattern for data access
- Use the existing tRPC router structure for new API endpoints
- Maintain the hierarchical container model when making schema changes
- Ensure proper type safety with Drizzle Zod schemas
- Use the established component patterns in the UI layer