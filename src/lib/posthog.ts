export function capture(event: string, properties?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('posthog.capture', event, properties)
  }
  // stub
}
