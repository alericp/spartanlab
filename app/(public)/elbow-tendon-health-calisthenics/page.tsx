import { permanentRedirect } from 'next/navigation'

// Permanent redirect (308) - tells search engines to transfer ranking to canonical URL
export default function ElbowTendonRedirect() {
  permanentRedirect('/protocols/elbow-tendon-health-calisthenics')
}
