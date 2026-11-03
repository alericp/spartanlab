import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * First-program builder gate. The page keeps this formula inline so the
 * modify entry check stays the only modify authority. These cases are the
 * same operators as the page assignments.
 */
function resolveBuilderRender(input: {
  showBuilder: boolean
  program: unknown
  shouldRenderModifyBuilder: boolean
}) {
  const shouldRenderInitialBuilder = input.showBuilder && input.program == null
  const shouldRenderProgramBuilder = input.shouldRenderModifyBuilder || shouldRenderInitialBuilder
  return { shouldRenderInitialBuilder, shouldRenderProgramBuilder }
}

const pageSource = readFileSync(
  fileURLToPath(new URL('../../app/(app)/program/page.tsx', import.meta.url)),
  'utf8',
)

describe('initial program builder render', () => {
  it('shows the first-program form only when the builder is open and no program is loaded', () => {
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: true, program: null, shouldRenderModifyBuilder: false }),
      { shouldRenderInitialBuilder: true, shouldRenderProgramBuilder: true },
    )
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: false, program: null, shouldRenderModifyBuilder: false }),
      { shouldRenderInitialBuilder: false, shouldRenderProgramBuilder: false },
    )
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: true, program: undefined, shouldRenderModifyBuilder: false }),
      { shouldRenderInitialBuilder: true, shouldRenderProgramBuilder: true },
    )
  })

  it('does not replace a loaded program or a modify builder with the first-program gate', () => {
    const savedProgram = { id: 'program-1' }
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: true, program: savedProgram, shouldRenderModifyBuilder: false }),
      { shouldRenderInitialBuilder: false, shouldRenderProgramBuilder: false },
    )
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: false, program: savedProgram, shouldRenderModifyBuilder: true }),
      { shouldRenderInitialBuilder: false, shouldRenderProgramBuilder: true },
    )
    assert.deepEqual(
      resolveBuilderRender({ showBuilder: true, program: null, shouldRenderModifyBuilder: true }),
      { shouldRenderInitialBuilder: true, shouldRenderProgramBuilder: true },
    )
  })

  it('wires the page to the first-program gate without moving modify-only checks', () => {
    assert.match(pageSource, /const shouldRenderInitialBuilder = showBuilder && program == null/)
    assert.match(
      pageSource,
      /const shouldRenderProgramBuilder = shouldRenderModifyBuilder \|\| shouldRenderInitialBuilder/,
    )
    assert.match(pageSource, /\{shouldRenderProgramBuilder \? \(/)
    assert.equal(pageSource.includes('{shouldRenderModifyBuilder ? ('), false)
    assert.equal((pageSource.match(/&& !shouldRenderModifyBuilder/g) ?? []).length, 2)
    assert.equal(pageSource.includes('!shouldRenderProgramBuilder'), false)
    assert.match(pageSource, /const serverResponse = await fetch\('\/api\/program\/generate-fresh'/)
    assert.match(pageSource, /handleGenerate\(\)/)

    const noProgram = pageSource.indexOf("setLoadStage('no-program')")
    const loadError = pageSource.indexOf("setLoadStage('program-load-error')")
    assert.equal(pageSource.slice(noProgram, noProgram + 160).includes('setShowBuilder(true)'), false)
    assert.equal(pageSource.slice(loadError, loadError + 160).includes('setShowBuilder(true)'), false)
    const restart = pageSource.indexOf('programModules.deleteAdaptiveProgram(program.id)')
    assert.match(pageSource.slice(restart, restart + 280), /setShowBuilder\(true\)/)
    assert.match(pageSource, /dashboardEmptyPresence\(false, onboardingAnswersSaved\)/)
    assert.match(pageSource, /Open Program Builder/)
  })
})
