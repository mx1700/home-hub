import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/services", "routes/api.services.ts"),
  route("api/events", "routes/api.events.ts"),
  route("api/health", "routes/api.health.ts"),
  route("icons/*", "routes/icons.ts"),
] satisfies RouteConfig;
