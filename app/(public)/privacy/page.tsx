'use client'

import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#A4ACB8]">
            Last updated: January 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="prose prose-invert max-w-none space-y-12">
            
            {/* Introduction */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">1. Introduction</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                SpartanLab is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have. We aim to be straightforward and transparent about our data practices.
              </p>
            </div>

            {/* What we collect */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">2. Information We Collect</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We collect information you provide directly and some information automatically when you use the platform.
              </p>
              
              <h3 className="text-lg font-medium mb-3 text-[#E6E9EF]">Account Information</h3>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                When you create an account, we collect your email address, name, and authentication credentials. If you sign in with a third-party provider like Google, we receive basic profile information from that provider.
              </p>

              <h3 className="text-lg font-medium mb-3 text-[#E6E9EF]">Profile and Preferences</h3>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                You may optionally provide profile information such as your training experience level, goals, and physical metrics. This helps us personalize your training recommendations.
              </p>

              <h3 className="text-lg font-medium mb-3 text-[#E6E9EF]">Training Data</h3>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We collect workout logs, exercise performance data, program information, and training history that you enter into the platform. This is the core data that powers your training analytics and recommendations.
              </p>

              <h3 className="text-lg font-medium mb-3 text-[#E6E9EF]">Usage Information</h3>
              <p className="text-[#A4ACB8] leading-relaxed">
                We automatically collect basic usage data such as pages visited, features used, device type, and browser information. This helps us understand how the platform is used and where we can improve.
              </p>
            </div>

            {/* How we use data */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">3. How We Use Your Information</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="space-y-2 text-[#A4ACB8]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Provide and operate the SpartanLab platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Generate personalized training recommendations and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Process payments and manage subscriptions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Send service-related communications (account updates, security alerts)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Improve and develop new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Respond to support requests</span>
                </li>
              </ul>
            </div>

            {/* Billing and payments */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">4. Billing and Payments</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Payment processing is handled by Stripe, a trusted third-party payment provider. We do not store your full credit card number on our servers.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                We retain basic billing information such as transaction history and subscription status to manage your account and provide support.
              </p>
            </div>

            {/* Third-party providers */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">5. Third-Party Service Providers</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We use trusted third-party providers to operate SpartanLab:
              </p>
              <ul className="space-y-2 text-[#A4ACB8] mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Authentication:</strong> Clerk handles secure sign-in and account management.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Payments:</strong> Stripe processes all payment transactions securely.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Infrastructure:</strong> Cloud hosting and database services store and serve your data.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Analytics:</strong> Service monitoring tools help us understand usage patterns and improve the platform.</span>
                </li>
              </ul>
              <p className="text-[#A4ACB8] leading-relaxed">
                These providers access only the data necessary to perform their functions and are bound by their own privacy policies and security practices.
              </p>
            </div>

            {/* Data sharing */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">6. Data Sharing</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We do not sell your personal information. We share data only in limited circumstances:
              </p>
              <ul className="space-y-2 text-[#A4ACB8]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Service Providers:</strong> As described above, to operate the platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred to the new entity.</span>
                </li>
              </ul>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">7. Cookies and Sessions</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use the platform.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                Essential cookies are required for the platform to function. You can control non-essential cookies through your browser settings, though this may affect some features.
              </p>
            </div>

            {/* Data security */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">8. Data Security</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS), secure authentication, and access controls.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                While we take reasonable precautions, no system is completely secure. We encourage you to use a strong, unique password and enable any available security features on your account.
              </p>
            </div>

            {/* Data retention */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">9. Data Retention</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within a reasonable timeframe, except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </div>

            {/* User rights */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">10. Your Rights</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal data:
              </p>
              <ul className="space-y-2 text-[#A4ACB8]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Access and download your data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Correct inaccurate information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Request deletion of your data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Object to certain processing activities</span>
                </li>
              </ul>
              <p className="text-[#A4ACB8] leading-relaxed mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:support@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  support@spartanlab.app
                </a>.
              </p>
            </div>

            {/* Children */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">11. Children&apos;s Privacy</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                SpartanLab is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with their data, please contact us and we will delete it.
              </p>
            </div>

            {/* Changes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">12. Changes to This Policy</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the platform or sending an email. Your continued use of SpartanLab after changes take effect constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">13. Contact Us</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:support@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  support@spartanlab.app
                </a>.
              </p>
            </div>

          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
