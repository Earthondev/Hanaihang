import React from 'react';
import { Store, Building, Search } from 'lucide-react';
import { BaseButton } from './BaseButton';

interface EmptyStateProps {
  type: 'malls' | 'stores' | 'search';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionLabel, 
  actionHref, 
  onAction 
}: EmptyStateProps) {
  const icons = {
    malls: Building,
    stores: Store,
    search: Search
  };

  const Icon = icons[type];

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 grid place-items-center">
        <Icon className="h-6 w-6 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {actionLabel && (
        <div className="flex justify-center">
          {actionHref ? (
            <a 
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium transition-all duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98]"
            >
              {actionLabel}
            </a>
          ) : (
            <BaseButton 
              variant="primary" 
              onClick={onAction}
            >
              {actionLabel}
            </BaseButton>
          )}
        </div>
      )}
    </div>
  );
}
