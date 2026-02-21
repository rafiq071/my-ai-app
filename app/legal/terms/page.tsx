import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#1f1f2e] bg-[#0a0a0f] py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/landing" className="text-[#6366f1] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: February 16, 2025</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using Lovable Clone ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            <p className="text-gray-300">
              If you do not agree to these Terms of Service, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              Lovable Clone provides an AI-powered application development platform that allows users to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Generate code using AI models</li>
              <li>Preview applications in real-time</li>
              <li>Deploy applications to hosting platforms</li>
              <li>Store and manage projects</li>
              <li>Export code and projects</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Maintaining the security of your account</li>
              <li>All activities that occur under your account</li>
              <li>Keeping your password confidential</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-gray-300 mb-4">
              You agree NOT to use the Service to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Generate malicious code or malware</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for cryptocurrency mining</li>
              <li>Resell or redistribute the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Generated Code Ownership</h2>
            <p className="text-gray-300 mb-4">
              You own the code generated through the Service. We do not claim ownership of your generated code or projects.
            </p>
            <p className="text-gray-300">
              However, you acknowledge that AI-generated code may be similar to code generated for other users, and we cannot guarantee uniqueness.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Subscription and Payment</h2>
            <p className="text-gray-300 mb-4">
              <strong>Free Tier:</strong> Subject to usage limits. We may modify limits at any time.
            </p>
            <p className="text-gray-300 mb-4">
              <strong>Paid Plans:</strong> Billed monthly or annually. No refunds for partial months.
            </p>
            <p className="text-gray-300 mb-4">
              <strong>Cancellation:</strong> You may cancel at any time. Access continues until the end of the billing period.
            </p>
            <p className="text-gray-300">
              <strong>Price Changes:</strong> We may change prices with 30 days notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Service Availability</h2>
            <p className="text-gray-300 mb-4">
              We strive for 99.9% uptime but do not guarantee uninterrupted service. The Service may be unavailable during:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Emergency maintenance</li>
              <li>Third-party service outages (OpenAI, Vercel, etc.)</li>
              <li>Force majeure events</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Errors or inaccuracies in AI-generated code</li>
              <li>Third-party actions or content</li>
            </ul>
            <p className="text-gray-300">
              Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-gray-300 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or reliability of generated code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-gray-300">
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
            <p className="text-gray-300 mb-4">
              We may terminate or suspend your account at any time for:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment</li>
              <li>At our sole discretion</li>
            </ul>
            <p className="text-gray-300">
              Upon termination, you may export your projects within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
            <p className="text-gray-300">
              We may modify these Terms at any time. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p className="text-gray-300">
              These Terms shall be governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact</h2>
            <p className="text-gray-300">
              For questions about these Terms, contact us at:
            </p>
            <p className="text-[#6366f1] mt-2">
              support@lovable-clone.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
