# Agent Guidelines for Home Hub

This is a React Router v7 + TypeScript + Tailwind CSS project for a Docker service dashboard with Server-Sent Events (SSE) for real-time updates.

## Commands

```bash
npm run dev       # Start development server (http://localhost:5173)
npm run build     # Build for production
npm run start     # Start production server (requires build first)
npm run typecheck # Run TypeScript type checking
```

**No test framework is configured.** Do not add tests unless explicitly requested.

## Code Style

### TypeScript

- **Strict mode enabled** - all type checks are enforced
- **`verbatimModuleSyntax: true`** - always use `import type` for type-only imports
- **Always define return types** for functions, especially in classes and exported functions
- Use `interface` for object types, `type` for unions/intersections
- Avoid `any` - use `unknown` for truly unknown types, then narrow with type guards

### Imports

Path alias: `~/*` maps to `./app/*`

```typescript
import type { Route } from "./+types/api.services";
import type { Service } from "~/types";
import { serviceStore } from "~/lib/store";
```

**Import order:** External packages → Route types (`./+types/...`) → Internal types (`~/types`) → Internal modules (`~/lib`, `~/components`)

### File Naming

| Type | Convention | Examples |
|------|------------|----------|
| Routes | `kebab-case.ts(x)` | `api.services.ts`, `home.tsx` |
| Components | `PascalCase.tsx` | `ServiceCard.tsx`, `ServiceGrid.tsx` |
| Utilities/Lib | `kebab-case.ts` | `docker.ts`, `use-sse.ts` |
| Types | `index.ts` (single file) | `types/index.ts` |

### React Components

```typescript
interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [state, setState] = useState(initialValue);  // Hooks at top
  if (!service) return null;  // Early returns for edge cases
  return (/* JSX */);
}

// Helper functions outside component
function getStatusColor(status: Service['status']): string {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'stopped': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}
```

### React Router v7 Patterns

```typescript
import type { Route } from "./+types/api.services";

export async function loader({ request }: Route.LoaderArgs) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Page Title" }];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) { /* handle route errors */ }
}
```

### Classes and State Management

```typescript
export class ServiceStore {
  private services: Service[] = [];
  private listeners: ((services: Service[]) => void)[] = [];

  getServices(): Service[] {
    return [...this.services];  // Return copies
  }

  onChange(listener: (services: Service[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try { listener(this.services); }
      catch (error) { console.error('Error in listener:', error); }
    }
  }
}

export const serviceStore = new ServiceStore();
```

### Error Handling

- Use `try/catch` for async operations
- Log errors with `console.error()` - no structured logging library
- Catch listener callbacks to prevent one error from breaking others

### Tailwind CSS

- Use Tailwind v4 with `@tailwindcss/vite` plugin
- **Prefer utility classes** - avoid custom CSS
- Group related classes: layout → spacing → typography → colors → effects

```typescript
className="flex flex-col items-center gap-2 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800"
```

## Project Structure

```
app/
├── components/       # React components (PascalCase.tsx)
├── lib/             # Utilities, stores, integrations (kebab-case.ts)
├── routes/          # React Router routes (+types/ auto-generated)
├── types/           # TypeScript type definitions
├── root.tsx         # App root with Layout, ErrorBoundary
└── app.css          # Tailwind imports only
data/
└── categories.json  # Category configuration (hot-reloadable)
```

## Docker Label Convention

| Label | Required | Default | Description |
|-------|----------|---------|-------------|
| `home-hub.name` | Yes | - | Display name |
| `home-hub.url` | No | - | Full URL (bypasses host/port) |
| `home-hub.host` | No | Docker Host IP | Custom host/IP |
| `home-hub.port` | No | 80 | Service port |
| `home-hub.icon` | No | Auto initials | Icon URL |
| `home-hub.category` | No | "其他" | Category name |
| `home-hub.description` | No | - | Service description |
| `home-hub.order` | No | 0 | Sort order (lower = first) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket path |
| `DOCKER_HOST_IP` | `host.docker.internal` | Docker host IP |
| `DATA_DIR` | `./data` | Icon cache directory |
| `PORT` | `3000` | Server port |

## What NOT To Do

- Do NOT add ESLint or Prettier (not configured)
- Do NOT create separate CSS files (use Tailwind utilities)
- Do NOT use CSS modules or styled-components
- Do NOT add testing libraries (Vitest, Jest)
- Do NOT change the React Router version
- Do NOT use ClientLoader/ClientAction unless necessary (prefer server-side loaders)
- Do NOT use `any` type - use `unknown` with type guards
