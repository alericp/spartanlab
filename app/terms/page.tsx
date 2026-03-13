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

            {/* Subscription / billing */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">5. Subscriptions and Billing</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Some features of SpartanLab require a paid subscription. By subscribing, you agree to pay all applicable fees. Subscriptions automatically renew unless cancelled before the renewal date.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Refunds are handled on a case-by-case basis. For billing inquiries, contact us at{' '}
                <a href="mailto:billing@spartanlab.app" className="text-[#E6E9EF] hover:underline">
                  billing@spartanlab.app
                </a>.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                We reserve the right to change pricing with reasonable notice. Any price changes will apply to the next billing cycle after the change is announced.
              </p>
            </div>

            {/* No guaranteed outcomes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">6. No Guaranteed Fitness Outcomes</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab provides training tools and recommendations, but individual results vary based on many factors including genetics, consistency, nutrition, sleep, and overall health.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                We do not guarantee any specific fitness outcomes, strength gains, or skill achievements. Use the platform as a guide, not as a guarantee.
              </p>
            </div>

            {/* Educational / informational */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">7. Educational and Informational Use</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                The content provided by SpartanLab is for educational and informational purposes only. It is not intended as medical advice, physical therapy, or a substitute for professional guidance.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                Consult a qualified healthcare provider or fitness professional before starting any new exercise program, especially if you have pre-existing health conditions or injuries.
              </p>
            </div>

            {/* Intellectual property */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">8. Intellectual Property</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                All content, features, and functionality of SpartanLab—including text, graphics, logos, and software—are owned by SpartanLab and protected by intellectual property laws.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative works from our content without explicit written permission.
              </p>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">9. Termination and Suspension</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                You may cancel your account at any time through your account settings or by contacting support. Upon cancellation, your access to paid features will end at the conclusion of your current billing period.
              </p>
            </div>

            {/* Limitation of liability */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">10. Limitation of Liability</h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                SpartanLab is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                To the maximum extent permitted by law, SpartanLab shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </div>

            {/* Changes to terms */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">11. Changes to Terms</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                We may update these Terms of Service from time to time. We will notify users of significant changes by posting a notice on the platform or sending an email. Your continued use of SpartanLab after changes take effect constitutes acceptance of the updated terms.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">12. Contact</h2>
              <p className="text-[#A4ACB8] leading-relaxed">
                If you have questions about these Terms of Service, please contact us at{' '}
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
