"use client";
import Link from 'next/link';
import { MicroAppDefinition } from '@/app/lib/apps/registry';
import { Button } from '@/components/ui/button';

export function AppTile({ app }: { app: MicroAppDefinition }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg text-purple-600">
          {typeof app.icon === 'string' ? (
            <span className="font-semibold">{app.icon}</span>
          ) : (
            app.icon
          )}
        </div>
        <h4 className="ml-3 text-lg font-medium text-gray-900">{app.title}</h4>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Available in: {app.allowedPlans.join(', ')}</div>
        <Link href={app.route}>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Open</Button>
        </Link>
      </div>
    </div>
  );
}

export default AppTile;

