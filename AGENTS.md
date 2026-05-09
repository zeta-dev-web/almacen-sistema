<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Commands

```bash
pnpm dev           # Dev server: http://localhost:3000
pnpm build         # Production build
pnpm start         # Production server
pnpm lint          # ESLint
pnpm format        # Prettier (src/**/*.{ts,tsx,js,jsx,json,css})
pnpm migrate       # Create + apply migration
pnpm migrate:deploy # Apply migrations (production)
pnpm reset         # Reset database
pnpm studio        # Prisma Studio
pnpm postinstall   # Runs automatically (prisma generate)
```

# Architecture

```
src/
├── app/                    # Next.js App Router (pages, layouts)
├── components/
│   ├── common/           # Generic components (DataTable, GenericModal, ConfirmModal)
│   └── ui/               # shadcn/ui components
├── constants/            # routes.ts, config.constant.ts, error-messages.constant.ts
├── lib/                  # Utilities (prisma.ts, utils)
├── server/
│   ├── repository/       # Data access (Prisma queries)
│   └── services/        # Business logic
├── services/            # API clients (Axios)
└── utils/               # Handlers (clientError.handler, apiError.handler)
```

# Patterns

## Backend Error
```typescript
import { ApiError } from "@/utils/handlers/apiError.handler";
import { httpStatus } from "http-status";

throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Usuario no encontrado" });
```

## Frontend Error
```typescript
import { clientErrorHandler } from "@/utils/handlers/clientError.handler";

clientErrorHandler(error, callback, { showToast: true, messagePrefix: "Error: " });
```

# Environment

Copy `.env.example` to `.env` and configure:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL=""
```

After env setup, run migrations:
```bash
pnpm migrate dev --name init
```

# Stack

- Next.js 16 (App Router)
- Prisma 7 + PostgreSQL
- Tailwind CSS 4
- TypeScript (strict mode)
- pnpm 10.20.0