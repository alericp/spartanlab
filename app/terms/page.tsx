'use client'

import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
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
            
            {/* Acceptance */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">1. Acceptance of Terms</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                By accessing or using SpartanLab, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
              </p>
            </div>

            {/* Who the service is for */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">2. Service Description</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab is a calisthenics training platform that provides workout tracking, program generation, and training analytics. The service is designed for individuals interested in bodyweight strength training and skill development.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You must be at least 18 years old to use this service, or have permission from a parent or guardian.
              </p>
            </div>

            {/* Account responsibility */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">3. Account Responsibility</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your account information.
              </p>
            </div>

            {/* Acceptable use */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">4. Acceptable Use</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                You agree to use SpartanLab only for lawful purposes and in accordance with these terms. You may not:
              </p>
              <ul className="space-y-2 text-[#A4ACB8]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Use the service to transmit harmful, offensive, or illegal content</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Attempt to gain unauthorized access to our systems or other users&apos; accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Interfere with or disrupt the platform or servers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Scrape, copy, or redistribute content without permission</span>
                </li>
              </ul>
            </div>

            {/* Service Tiers */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">5. Service Tiers</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab offers both free and paid tiers:
              </p>
              <ul className="space-y-2 text-[#A4ACB8] mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Free Tier:</strong> Access to training tools, calculators, guides, and basic progress tracking.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span><strong className="text-[#E6E9EF]">Pro Tier:</strong> Full access to the Adaptive Training Engine, personalized programs, workout tracking, analytics, and all premium features. Currently priced at $15/month.</span>
                </li>
              </ul>
              <p className="text-[#A4ACB8] leading-relaxed">
                We reserve the right to modify features available in each tier. Material changes will be communicated in advance.
              </p>
            </div>

            {/* Subscription / billing */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">6. Subscriptions and Billing</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Paid subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date. You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Payments are processed securely through Stripe. SpartanLab does not store your full credit card number on our servers. By subscribing, you authorize us to charge your payment method on a recurring basis.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Refunds are considered on a case-by-case basis. For billing inquiries, refunds, or invoice requests, contact us at{' '}
                <a href="mailto:billing@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  billing@spartanlab.app
                </a>.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                We reserve the right to change pricing with at least 30 days notice. Any price changes will apply to the next billing cycle after the notice period.
              </p>
            </div>

            {/* Third-party providers */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">7. Third-Party Service Providers</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab uses trusted third-party providers to operate the platform, including services for:
              </p>
              <ul className="space-y-2 text-[#A4ACB8] mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Cloud hosting and infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Authentication and account security</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Payment processing (Stripe)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Data storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Analytics and service monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Email and communications</span>
                </li>
              </ul>
              <p className="text-[#A4ACB8] leading-relaxed">
                These providers are bound by their own terms and privacy policies. We select providers with strong security and privacy practices.
              </p>
            </div>

            {/* No guaranteed outcomes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">8. No Guaranteed Fitness Outcomes</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab provides training tools and recommendations, but individual results vary based on many factors including genetics, consistency, nutrition, sleep, and overall health.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                We do not guarantee any specific fitness outcomes, strength gains, skill achievements, or injury avoidance. Use the platform as a training guide, not as a guarantee of results.
              </p>
            </div>

            {/* Educational / informational */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">9. Educational and Informational Use Only</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                The content provided by SpartanLab is for educational and informational purposes only. It is not intended as:
              </p>
              <ul className="space-y-2 text-[#A4ACB8] mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Medical advice, diagnosis, or treatment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>Physical therapy or rehabilitation guidance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C1121F] mt-1">•</span>
                  <span>A substitute for professional medical or fitness guidance</span>
                </li>
              </ul>
              <p className="text-[#A4ACB8] leading-relaxed">
                Consult a qualified healthcare provider or fitness professional before starting any new exercise program, especially if you have pre-existing health conditions, injuries, or concerns about your ability to exercise safely.
              </p>
            </div>

            {/* Intellectual property */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">10. Intellectual Property</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                All content, features, and functionality of SpartanLab—including text, graphics, logos, software, and training algorithms—are owned by SpartanLab and protected by intellectual property laws.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You may not reproduce, distribute, modify, reverse engineer, or create derivative works from our content without explicit written permission.
              </p>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">11. Termination and Suspension</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at any time for violation of these terms, abuse of the platform, or for any other reason at our discretion.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You may cancel your account at any time through your account settings or by contacting support. Upon cancellation, your access to paid features will end at the conclusion of your current billing period. Your training data may be retained for a reasonable period to allow account recovery.
              </p>
            </div>

            {/* Limitation of liability */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">12. Disclaimer and Limitation of Liability</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                To the maximum extent permitted by law, SpartanLab shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to injury, loss of data, or loss of profits.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You assume all risk associated with your use of the platform and any exercise activities undertaken based on information provided through SpartanLab.
              </p>
            </div>

            {/* Changes to terms */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">13. Changes to Terms</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                We may update these Terms of Service from time to time. We will notify users of material changes by posting a notice on the platform or sending an email. Your continued use of SpartanLab after changes take effect constitutes acceptance of the updated terms.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">14. Contact</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                For general questions about these Terms of Service:{' '}
                <a href="mailto:support@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  support@spartanlab.app
                </a>
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                For billing and subscription inquiries:{' '}
                <a href="mailto:billing@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  billing@spartanlab.app
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
