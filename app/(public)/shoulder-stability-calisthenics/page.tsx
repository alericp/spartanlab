import { permanentRedirect } from 'next/navigation'

// Permanent redirect (308) - tells search engines to transfer ranking to canonical URL
export default function ShoulderStabilityRedirect() {
  permanentRedirect('/protocols/shoulder-stability-calisthenics')
}
