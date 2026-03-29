import type { Service } from '~/types';

interface ServiceCardProps {
  service: Service;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: Service['status']): string {
  switch (status) {
    case 'running':
      return 'bg-green-500';
    case 'stopped':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function ServiceCard({ service }: ServiceCardProps) {
  const hasIcon = service.icon && service.icon.length > 0;

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800"
    >
      <div className="flex flex-col items-center">
        {/* Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          {hasIcon ? (
            <img
              src={service.icon}
              alt={service.name}
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback to initials on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-2xl font-bold text-gray-600 dark:text-gray-300">${getInitials(service.name)}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {getInitials(service.name)}
            </span>
          )}
        </div>

        {/* Name and Status */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {service.name}
          </h3>
          <span
            className={`h-2.5 w-2.5 rounded-full ${getStatusColor(service.status)}`}
            title={service.status === 'running' ? '在线' : '离线'}
          />
        </div>

        {/* Description */}
        {service.description && (
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {service.description}
          </p>
        )}

        {/* Category */}
        <span className="mt-3 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {service.category}
        </span>
      </div>
    </a>
  );
}
