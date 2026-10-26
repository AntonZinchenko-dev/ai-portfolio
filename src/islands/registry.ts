import type { ComponentType } from 'react';

/** Код каждого острова грузится отдельным чанком, только когда он нужен. */
export const islands: Record<string, () => Promise<{ default: ComponentType<Record<string, unknown>> }>> = {
  evolution: () => import('./Evolution') as never,
  'intake-demo': () => import('./IntakeDemo') as never,
  'video-showcase': () => import('./VideoShowcase') as never,
  'fit-matrix': () => import('./FitMatrix') as never,
  'ask-widget': () => import('./AskWidget') as never,
  'hr-event': () => import('./HrEvent') as never,
};
