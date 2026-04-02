import { getMemoryUsage } from '~/lib/init';

export async function loader() {
  const mem = getMemoryUsage();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: mem,
  };

  return new Response(JSON.stringify(health, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
