default: list

# List all available tasks
list:
    @just --list

# Start development server
[group('dev')]
dev:
    pnpm dev

# Build the application
[group('dev')]
build:
    pnpm build

# Start production server
[group('dev')]
start:
    pnpm start

# Build and start production server
[group('dev')]
preview:
    pnpm preview

# Run linting and type checking
[group('quality')]
check:
    pnpm check

# Run ESLint
[group('quality')]
lint:
    pnpm lint

# Run ESLint with auto-fix
[group('quality')]
lint-fix:
    pnpm lint:fix

# Type check with TypeScript
[group('quality')]
tc:
    pnpm tc

# Check Prettier formatting
[group('quality')]
format-check:
    pnpm format:check

# Apply Prettier formatting
[group('quality')]
format:
    pnpm format:write

# Generate database migrations
[group('database')]
db-generate:
    pnpm db:generate

# Run database migrations
[group('database')]
db-migrate:
    pnpm db:migrate

# Push schema changes to database
[group('database')]
db-push:
    pnpm db:push

# Open Drizzle Studio
[group('database')]
db-studio:
    pnpm db:studio
