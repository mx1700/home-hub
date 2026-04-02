import React from 'react';
import type { Service } from '~/types';
import type { CategoriesConfig } from '~/lib/categories';
import { ServiceCard } from './ServiceCard';

interface ServiceGridProps {
  services: Service[];
  categoriesConfig: CategoriesConfig;
}

export function ServiceGrid({ services, categoriesConfig }: ServiceGridProps): React.ReactElement {
  if (services.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">没有找到服务</p>
      </div>
    );
  }

  const grouped = services.reduce((acc, service) => {
    const category = service.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const getCategoryOrder = (categoryName: string): number => {
    const category = categoriesConfig.categories.find(c => c.name === categoryName);
    return category?.order ?? categoriesConfig.defaultOrder;
  };

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = getCategoryOrder(a);
    const orderB = getCategoryOrder(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.localeCompare(b, 'zh-CN');
  });

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-200">{category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {grouped[category].map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
