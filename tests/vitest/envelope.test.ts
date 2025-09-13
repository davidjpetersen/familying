import { describe, it, expect } from 'vitest';
import { linearEnvelopeSteps } from '@/lib/soundscapes/envelope';

describe('linearEnvelopeSteps', () => {
  it('computes steps and values', () => {
    const { steps, values } = linearEnvelopeSteps(1000, 100);
    expect(steps).toBe(10);
    expect(values[0]).toBeCloseTo(0.1);
    expect(values[9]).toBeCloseTo(1);
  });
});

