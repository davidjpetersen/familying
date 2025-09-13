import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MicroApps } from '@/lib/apps/registry';
import '@/lib/apps/registerAll';
import { getFlag } from '@/lib/flags';
import { isEntitled } from '@/lib/entitlements';

// Server component to route to the micro-app page
export default async function AppPage({ params }: { params: { slug: string } }) {
  const app = MicroApps.getAppBySlug(params.slug);
  if (!app) return notFound();

  // Basic server-side gating via flags/entitlements (plan is unknown here; assume plus for demo)
  const flagOk = app.featureFlag ? getFlag(app.featureFlag) : true;
  const plan = 'plus';
  const entitlementOk = isEntitled({ plan, app });
  if (!flagOk || !entitlementOk) return notFound();

  const AppModule = dynamic(() => resolveAppModule(app.slug), { ssr: false });
  // @ts-expect-error server-to-client component boundary
  return <AppModule />;
}

function resolveAppModule(slug: string) {
  switch (slug) {
    case 'soundscapes':
      return import('@/(protected)/apps/soundscapes/page');
    default:
      return Promise.reject(new Error('Unknown app'));
  }
}
