"use client";
import Link from 'next/link';
import { MicroAppDefinition } from '@/lib/apps/registry';
import { Button } from '@/components/ui/button';

export function AppTile({ app }: { app: MicroAppDefinition }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
          {typeof app.icon === 'string' ? (
            <span className="font-semibold">{app.icon}</span>
          ) : (
            app.icon
          )}
        </div>
        <h4 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">{app.title}</h4>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">Available in: {app.allowedPlans.join(', ')}</div>
        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700" aria-label={`Open ${app.title}`}>
          <Link href={app.route}>Open</Link>
        </Button>
      </div>
    </div>
  );
}

export default AppTile;

