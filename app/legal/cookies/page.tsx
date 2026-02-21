import Link from 'next/link'

export default function CookiePolicy() {
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
        <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 16, 2025</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-300 mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences and improve your experience.
            </p>
            <p className="text-gray-300">
              Lovable Clone uses cookies and similar technologies to provide, protect, and improve our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Types of Cookies We Use</h2>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Essential Cookies</h3>
            <p className="text-gray-300 mb-4">
              <strong>Required for the Service to function.</strong> Cannot be disabled.
            </p>
            <div className="bg-[#1f1f2e] rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#2a2a3e]">
                    <th className="text-white py-2">Cookie</th>
                    <th className="text-white py-2">Purpose</th>
                    <th className="text-white py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">next-auth.session-token</td>
                    <td className="py-2">Authentication session</td>
                    <td className="py-2">30 days</td>
                  </tr>
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">next-auth.csrf-token</td>
                    <td className="py-2">Security protection</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2">__Secure-next-auth.callback-url</td>
                    <td className="py-2">OAuth redirect</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Functional Cookies</h3>
            <p className="text-gray-300 mb-4">
              <strong>Remember your preferences.</strong> Can be disabled in settings.
            </p>
            <div className="bg-[#1f1f2e] rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#2a2a3e]">
                    <th className="text-white py-2">Cookie</th>
                    <th className="text-white py-2">Purpose</th>
                    <th className="text-white py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">theme-preference</td>
                    <td className="py-2">Dark/light mode</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">editor-settings</td>
                    <td className="py-2">Editor preferences</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2">language</td>
                    <td className="py-2">Preferred language</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Analytics Cookies</h3>
            <p className="text-gray-300 mb-4">
              <strong>Help us understand how you use the Service.</strong> Can be disabled.
            </p>
            <div className="bg-[#1f1f2e] rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#2a2a3e]">
                    <th className="text-white py-2">Cookie</th>
                    <th className="text-white py-2">Purpose</th>
                    <th className="text-white py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">_ga</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">2 years</td>
                  </tr>
                  <tr className="border-b border-[#2a2a3e]">
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">24 hours</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gat</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">1 minute</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-300 mb-4">
              We use third-party services that may set cookies:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Google Analytics:</strong> Usage analytics</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and performance</li>
            </ul>
            <p className="text-gray-300">
              These services have their own privacy policies and cookie policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. How to Control Cookies</h2>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.1 Browser Settings</h3>
            <p className="text-gray-300 mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Opt-Out Links</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Google Analytics:</strong>{' '}
                <a 
                  href="https://tools.google.com/dlpage/gaoptout" 
                  className="text-[#6366f1] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Browser Add-on
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Impact of Disabling Cookies</h3>
            <p className="text-gray-300 mb-4">
              If you disable cookies:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>You may not be able to sign in</li>
              <li>Some features may not work properly</li>
              <li>Your preferences won't be saved</li>
              <li>We can't provide personalized experiences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Session Storage and Local Storage</h2>
            <p className="text-gray-300 mb-4">
              In addition to cookies, we use:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Session Storage:</strong> Temporary data (cleared when browser closes)</li>
              <li><strong>Local Storage:</strong> Persistent data (user preferences, draft code)</li>
            </ul>
            <p className="text-gray-300">
              You can clear these in your browser settings under "Site Data" or "Storage".
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookie Consent</h2>
            <p className="text-gray-300 mb-4">
              When you first visit our website, we display a cookie banner asking for your consent for non-essential cookies.
            </p>
            <p className="text-gray-300 mb-4">
              You can:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Customize your preferences</li>
            </ul>
            <p className="text-gray-300">
              Essential cookies are always active as they're required for the Service to function.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Updates to This Policy</h2>
            <p className="text-gray-300">
              We may update this Cookie Policy from time to time. The "Last updated" date will be revised. We recommend reviewing this page periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-gray-300">
              Questions about cookies? Contact us at:{' '}
              <span className="text-[#6366f1]">privacy@lovable-clone.com</span>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. More Information</h2>
            <p className="text-gray-300 mb-4">
              For more information about cookies:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                <a 
                  href="https://www.allaboutcookies.org/" 
                  className="text-[#6366f1] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  All About Cookies
                </a>
              </li>
              <li>
                <a 
                  href="https://cookiepedia.co.uk/" 
                  className="text-[#6366f1] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cookiepedia
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
