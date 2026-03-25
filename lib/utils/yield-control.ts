/**
 * [PHASE 16C] Cooperative Main-Thread Yielding Utilities
 * 
 * These helpers allow long-running synchronous code to yield control
 * back to the browser's event loop, enabling:
 * - UI updates during heavy computation
 * - Timeout/abort checking between stages
 * - Progress indicator updates
 * 
 * CRITICAL: This is required to prevent the generation hang where
 * the builder monopolizes the main thread and prevents React from
 * updating the loading UI or checking timeouts.
 */

/**
 * Yields control to the main thread so the browser can:
 * - Paint UI updates
 * - Process pending events
 * - Check abort signals
 * - Update progress indicators
 * 
 * @param label - Optional label for debugging/logging
 */
export async function yieldToMainThread(label?: string): Promise<void> {
  if (label) {
    console.log(`[phase16c-yield] Yielding: ${label}`)
  }
  
  // [PHASE 16F] Log yield start
  const yieldStart = Date.now()
  
  // Use setTimeout(0) which schedules a macrotask
  // This ensures pending microtasks and render frames can execute
  await new Promise<void>(resolve => setTimeout(resolve, 0))
  
  // [PHASE 16F] Log yield complete
  const yieldDuration = Date.now() - yieldStart
  if (yieldDuration > 100) {
    console.log('[phase16f-yield-slow-audit]', {
      label,
      durationMs: yieldDuration,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Yields with requestAnimationFrame for visual-sensitive yields
 * Use this before UI-related state updates
 */
export async function yieldForRender(label?: string): Promise<void> {
  if (label) {
    console.log(`[phase16c-yield-render] Yielding for render: ${label}`)
  }
  
  // If we're in a browser context with RAF available
  if (typeof requestAnimationFrame !== 'undefined') {
    await new Promise<void>(resolve => 
      requestAnimationFrame(() => setTimeout(resolve, 0))
    )
  } else {
    // Fallback for non-browser environments
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  }
}

console.log('[phase16c-yield-helper-created-audit]', {
  yieldToMainThread: 'available',
  yieldForRender: 'available',
  purpose: 'cooperative_async_generation',
})

// =============================================================================
// [PHASE 16C TASK 6] Generation Context for abort/budget tracking
// =============================================================================

export interface GenerationContext {
  startedAt: number
  currentStage: string
  totalBudgetMs: number
  stageBudgets: Record<string, number>
  aborted: boolean
  abortReason?: string
  timings: Record<string, number>
  stageStartTime: number
  
  // Methods
  markStage: (stage: string) => void
  checkBudget: (stage: string) => void
  shouldAbort: () => boolean
  yieldNow: (label?: string) => Promise<void>
  getElapsed: () => number
  getStageElapsed: () => number
}

/**
 * Creates a generation context for tracking stages, budgets, and abort conditions
 */
export function createGenerationContext(options?: {
  totalBudgetMs?: number
  stageBudgets?: Record<string, number>
  onStageChange?: (stage: string) => void
}): GenerationContext {
  const startedAt = Date.now()
  const totalBudgetMs = options?.totalBudgetMs ?? 25000 // 25 second total budget
  const stageBudgets = options?.stageBudgets ?? {
    input_resolution: 2000,
    weekly_structure: 3000,
    skill_allocation: 4000,
    session_construction: 12000,
    post_processing: 3000,
    validation: 2000,
    save: 2000,
  }
  
  const ctx: GenerationContext = {
    startedAt,
    currentStage: 'init',
    totalBudgetMs,
    stageBudgets,
    aborted: false,
    abortReason: undefined,
    timings: {},
    stageStartTime: startedAt,
    
    markStage(stage: string) {
      const now = Date.now()
      // Record timing for previous stage
      if (ctx.currentStage !== 'init') {
        ctx.timings[ctx.currentStage] = now - ctx.stageStartTime
      }
      ctx.currentStage = stage
      ctx.stageStartTime = now
      
      console.log('[phase16c-generation-context-audit]', {
        stage,
        totalElapsedMs: now - startedAt,
        previousStageTiming: ctx.timings,
      })
      
      // Call optional stage change callback
      options?.onStageChange?.(stage)
    },
    
    checkBudget(stage: string) {
      const totalElapsed = Date.now() - startedAt
      const stageElapsed = Date.now() - ctx.stageStartTime
      const stageBudget = stageBudgets[stage] ?? 5000
      
      // Check total budget
      if (totalElapsed > totalBudgetMs) {
        ctx.aborted = true
        ctx.abortReason = `Total budget exceeded: ${totalElapsed}ms > ${totalBudgetMs}ms at stage ${stage}`
        console.log('[phase16c-stage-budget-breach-verdict]', {
          type: 'total_budget',
          stage,
          totalElapsedMs: totalElapsed,
          budgetMs: totalBudgetMs,
        })
      }
      
      // Check stage budget
      if (stageElapsed > stageBudget) {
        ctx.aborted = true
        ctx.abortReason = `Stage budget exceeded: ${stage} took ${stageElapsed}ms > ${stageBudget}ms`
        console.log('[phase16c-stage-budget-breach-verdict]', {
          type: 'stage_budget',
          stage,
          stageElapsedMs: stageElapsed,
          stageBudgetMs: stageBudget,
        })
      }
      
      console.log('[phase16c-stage-budget-audit]', {
        stage,
        stageElapsedMs: stageElapsed,
        stageBudgetMs: stageBudget,
        totalElapsedMs: totalElapsed,
        totalBudgetMs,
        withinBudget: !ctx.aborted,
      })
    },
    
    shouldAbort() {
      return ctx.aborted
    },
    
    async yieldNow(label?: string) {
      await yieldToMainThread(label)
    },
    
    getElapsed() {
      return Date.now() - startedAt
    },
    
    getStageElapsed() {
      return Date.now() - ctx.stageStartTime
    },
  }
  
  return ctx
}

/**
 * Throws a generation error if context indicates abort
 */
export function assertNotAborted(ctx: GenerationContext, stage: string): void {
  if (ctx.shouldAbort()) {
    console.log('[phase16c-context-abort-verdict]', {
      stage,
      reason: ctx.abortReason,
      totalElapsedMs: ctx.getElapsed(),
      timings: ctx.timings,
    })
    
    throw new Error(`Generation aborted at ${stage}: ${ctx.abortReason}`)
  }
}
