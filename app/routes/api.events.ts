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

  const stream = new ReadableStream({
    start(controller) {
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
        } catch (error) {
          // Client disconnected, cleanup will be handled by cancel or heartbeat
        }
      });

      // Subscribe to category config changes
      const unsubscribeCategories = categoryManager.onChange((categoriesConfig) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'categories.update', categoriesConfig })}\n\n`)
          );
        } catch (error) {
          // Client disconnected, cleanup will be handled by cancel or heartbeat
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch (error) {
          // Client disconnected
          cleanup();
        }
      }, 30000);

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribeServices();
        unsubscribeCategories();
      };

      // Cleanup on abort
      request.signal.addEventListener('abort', cleanup, { once: true });

      // Store cleanup for cancel handler
      (controller as any)._cleanup = cleanup;
    },
    cancel() {
      // This is called when the stream is cancelled (client disconnected)
      // Note: cleanup is handled by abort event, but this provides a fallback
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
