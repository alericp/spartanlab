import { permanentRedirect } from 'next/navigation'

// Permanent redirect (308) - tells search engines to transfer ranking to canonical URL
export default function KneeStabilityRedirect() {
  permanentRedirect('/protocols/knee-stability-calisthenics')
}
