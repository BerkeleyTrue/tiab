default: dev

# Start development server
dev:
    pnpm dev

# Build the application
build:
    pnpm build

# Start production server
start:
    pnpm start

# Build and start production server
preview:
    pnpm preview

# Run linting and type checking
check:
    pnpm check

# Run ESLint
lint:
    pnpm lint

# Run ESLint with auto-fix
lint-fix:
    pnpm lint:fix

# Type check with TypeScript
tc:
    pnpm tc

# Check Prettier formatting
format-check:
    pnpm format:check

# Apply Prettier formatting
format:
    pnpm format:write

# Generate database migrations
db-generate:
    pnpm db:generate

# Run database migrations
db-migrate:
    pnpm db:migrate

# Push schema changes to database
db-push:
    pnpm db:push

# Open Drizzle Studio
db-studio:
    pnpm db:studio
