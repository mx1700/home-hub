import type { Route } from "./+types/api.services";
import { serviceStore } from "~/lib/store";
import { initializeServices } from "~/lib/init";

// Initialize on first request
let initPromise: Promise<void> | null = null;

export async function loader({ request }: Route.LoaderArgs) {
  // Initialize services on first request
  if (!initPromise) {
    initPromise = initializeServices();
  }
  await initPromise;

  const services = serviceStore.getServices();

  return new Response(JSON.stringify({ services }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
