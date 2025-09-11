export function linearEnvelopeSteps(durationMs: number, intervalMs: number) {
  const steps = Math.max(1, Math.floor(durationMs / intervalMs));
  const values = Array.from({ length: steps }, (_, i) => Math.min(1, (i + 1) / steps));
  return { steps, values };
}

