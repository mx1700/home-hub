import type { Route } from "./+types/api.events";
import { serviceStore } from "~/lib/store";
import { categoryManager } from "~/lib/categories";
import { initializeServices } from "~/lib/init";

// Initialize on first request
let initPromise: Promise<void> | null = null;

export async function loader({ request }: Route.LoaderArgs) {
  // Initialize services on first request
  if (!initPromise) {
    initPromise = initializeServices();
  }
  await initPromise;
  const encoder = new TextEncoder();
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let cleaned = false;

      const cleanup = (): void => {
        if (cleaned) return;
        cleaned = true;
        clearInterval(heartbeat);
        unsubscribeServices();
        unsubscribeCategories();
        request.signal.removeEventListener('abort', cleanup);
      };

      // Send initial data
      const services = serviceStore.getServices();
      const categoriesConfig = categoryManager.getConfig();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'init', services, categoriesConfig })}\n\n`)
      );

      // Subscribe to store changes
      const unsubscribeServices = serviceStore.onChange((services) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'services.update', services })}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // Subscribe to category config changes
      const unsubscribeCategories = categoryManager.onChange((categoriesConfig) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'categories.update', categoriesConfig })}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 30000);

      cleanupFn = cleanup;
      request.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
