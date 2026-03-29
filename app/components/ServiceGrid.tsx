import { ServiceCard } from './ServiceCard';
import type { Service } from '~/types';

interface ServiceGridProps {
  services: Service[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">没有找到服务</p>
      </div>
    );
  }

  // Group services by category
  const grouped = services.reduce((acc, service) => {
    const category = service.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, categoryServices]) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-200">{category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {categoryServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
