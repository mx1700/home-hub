export async function loader() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return new Response(JSON.stringify(health), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
