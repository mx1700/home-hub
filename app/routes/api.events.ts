import type { Route } from "./+types/api.events";
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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const services = serviceStore.getServices();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'services.update', services })}\n\n`)
      );

      // Subscribe to store changes
      const unsubscribe = serviceStore.onChange((services) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'services.update', services })}\n\n`)
          );
        } catch (error) {
          // Client disconnected
          unsubscribe();
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
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
