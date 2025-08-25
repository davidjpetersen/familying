import { initializePlugins } from '@/lib/plugins'

let initialized = false

export async function ensurePluginsInitialized() {
  if (!initialized) {
    await initializePlugins()
    initialized = true
  }
}

// Initialize plugins when the module is loaded
if (typeof window === 'undefined') {
  // Only run on server side
  ensurePluginsInitialized().catch(console.error)
}
