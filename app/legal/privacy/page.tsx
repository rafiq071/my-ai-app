import Link from 'next/link'

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 16, 2025</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              Lovable Clone ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p className="text-gray-300">
              By using the Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, profile picture (from OAuth providers)</li>
              <li><strong>Payment Information:</strong> Credit card details (processed by Stripe, we don't store card numbers)</li>
              <li><strong>Project Data:</strong> Code, files, project descriptions you create or upload</li>
              <li><strong>Communications:</strong> Support messages, feedback, survey responses</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies (see Cookie Policy)</li>
              <li><strong>Log Data:</strong> Error logs, API requests, performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Third-Party Data</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>OAuth Providers:</strong> Google, GitHub (email, name, profile picture)</li>
              <li><strong>Analytics:</strong> Aggregated usage statistics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process AI code generation requests</li>
              <li>Store and sync your projects</li>
              <li>Process payments and prevent fraud</li>
              <li>Send important updates and notifications</li>
              <li>Provide customer support</li>
              <li>Improve and optimize the Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.1 Third-Party Services</h3>
            <p className="text-gray-300 mb-4">We share data with:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>OpenAI/Google/Anthropic:</strong> Your prompts for AI code generation</li>
              <li><strong>Vercel:</strong> Your code for deployment</li>
              <li><strong>Supabase:</strong> Your projects and account data (encrypted)</li>
              <li><strong>Stripe:</strong> Payment information</li>
              <li><strong>NextAuth.js:</strong> Authentication data</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Legal Requirements</h3>
            <p className="text-gray-300 mb-4">We may disclose your information if required to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or security threats</li>
              <li>Respond to government requests</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Business Transfers</h3>
            <p className="text-gray-300">
              If we merge, are acquired, or sell assets, your information may be transferred. We will notify you before your data is transferred and subject to a different privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300 mb-4">We implement security measures including:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest (database encryption)</li>
              <li>Secure authentication (OAuth 2.0)</li>
              <li>Regular security audits</li>
              <li>Access controls and monitoring</li>
              <li>Secure payment processing (PCI DSS compliant)</li>
            </ul>
            <p className="text-gray-300">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Active Accounts:</strong> Data retained while account is active</li>
              <li><strong>Inactive Accounts:</strong> Deleted after 12 months of inactivity (with notice)</li>
              <li><strong>Deleted Accounts:</strong> Data deleted within 30 days, backups within 90 days</li>
              <li><strong>Legal Holds:</strong> Data retained longer if required by law</li>
              <li><strong>Anonymized Data:</strong> May be retained for analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights (GDPR)</h2>
            <p className="text-gray-300 mb-4">If you're in the EU/EEA, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Limit how we use your data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Object:</strong> Object to data processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-300">
              To exercise these rights, contact us at privacy@lovable-clone.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-300 mb-4">If you're a California resident, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Know what personal information is collected</li>
              <li>Know if personal information is sold or disclosed</li>
              <li>Opt-out of the sale of personal information</li>
              <li>Access your personal information</li>
              <li>Request deletion of personal information</li>
              <li>Not be discriminated against for exercising these rights</li>
            </ul>
            <p className="text-gray-300">
              <strong>We do NOT sell your personal information.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
            <p className="text-gray-300">
              The Service is not intended for users under 13 years old. We do not knowingly collect information from children under 13. If you become aware that a child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Privacy Shield (where applicable)</li>
              <li>Data Processing Agreements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Do Not Track</h2>
            <p className="text-gray-300">
              We do not currently respond to "Do Not Track" browser signals. You can disable cookies in your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. The "Last updated" date will be revised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              For privacy-related questions or to exercise your rights:
            </p>
            <p className="text-gray-300">
              Email: <span className="text-[#6366f1]">privacy@lovable-clone.com</span>
            </p>
            <p className="text-gray-300 mt-2">
              Data Protection Officer: <span className="text-[#6366f1]">dpo@lovable-clone.com</span>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Supervisory Authority</h2>
            <p className="text-gray-300">
              If you're in the EU/EEA and have concerns about our data processing, you have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
