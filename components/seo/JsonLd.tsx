/**
 * JSON-LD Structured Data Component
 * Renders schema.org structured data for SEO rich results
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Render JSON-LD structured data in a script tag
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

/**
 * Render multiple JSON-LD schemas
 * 
 * Defensive: Returns null if schemas is undefined/empty to prevent prerender crashes
 */
export function JsonLdMultiple({ schemas }: { schemas: Record<string, unknown>[] }) {
  // Defensive guard: if schemas is undefined or not an array, return null
  if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
    return null
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
    </>
  )
}

export default JsonLd
