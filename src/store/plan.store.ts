import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanIntensity, GeneratedPlanItem } from '@/types'

interface PlanState {
  intensity:    PlanIntensity
  previewPlan:  GeneratedPlanItem[]
  confirmed:    boolean
  lastRescheduleDate: string | null

  setIntensity:          (intensity: PlanIntensity) => void
  setPreviewPlan:        (plan: GeneratedPlanItem[]) => void
  confirmPlan:           () => void
  setLastRescheduleDate: (date: string) => void
  resetPlan:             () => void
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      intensity:           'balanced',
      previewPlan:         [],
      confirmed:           false,
      lastRescheduleDate:  null,

      setIntensity: (intensity) => set({ intensity }),

      setPreviewPlan: (plan) => set({ previewPlan: plan }),

      confirmPlan: () => set({ confirmed: true, previewPlan: [] }),

      setLastRescheduleDate: (date) => set({ lastRescheduleDate: date }),

      resetPlan: () =>
        set({ intensity: 'balanced', previewPlan: [], confirmed: false }),
    }),
    {
      name: 'zeal-plan',
      partialize: (state) => ({
        intensity:           state.intensity,
        confirmed:           state.confirmed,
        lastRescheduleDate:  state.lastRescheduleDate,
      }),
    }
  )
)
