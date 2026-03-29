import type { Route } from "./+types/home";
import { useSSE } from "~/lib/use-sse";
import { ServiceGrid } from "~/components/ServiceGrid";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home Hub - Docker 服务导航" },
    { name: "description", content: "家庭服务器 Docker 服务导航" },
  ];
}

export default function Home() {
  const { services, connected, error } = useSSE();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Home Hub</h1>
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
                title={connected ? "已连接" : "未连接"}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {connected ? "实时更新中" : "连接断开"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ServiceGrid services={services} />
      </main>
    </div>
  );
}
