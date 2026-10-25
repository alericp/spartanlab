import { extname } from 'node:path'

const builderStub = new URL('./adaptive-program-builder-stub.ts', import.meta.url).href

function isAdaptiveProgramBuilder(specifier) {
  return specifier === './adaptive-program-builder'
    || specifier === '../adaptive-program-builder'
    || specifier.endsWith('/adaptive-program-builder')
    || specifier.endsWith('/adaptive-program-builder.ts')
}

export async function resolve(specifier, context, nextResolve) {
  if (isAdaptiveProgramBuilder(specifier)) {
    return { url: builderStub, shortCircuit: true }
  }
  const relative = specifier.startsWith('./') || specifier.startsWith('../')
  if (relative && extname(specifier) === '') {
    return nextResolve(`${specifier}.ts`, context)
  }
  return nextResolve(specifier, context)
}
