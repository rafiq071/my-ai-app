import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]">
      {/* Navigation */}
      <nav className="border-b border-[#1f1f2e] bg-[#0a0a0f] bg-opacity-90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <span className="text-xl font-bold text-white">Lovable Clone</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] text-white rounded-lg transition-colors font-medium"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Build Apps with
            <span className="block bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
              AI in Minutes
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Describe your app in plain English and watch AI generate production-ready code.
            Preview instantly, deploy with one click, and iterate in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="px-8 py-4 bg-[#6366f1] hover:bg-[#5558e3] text-white text-lg rounded-lg transition-colors font-semibold"
            >
              Start Building Free →
            </Link>
            <a
              href="#demo"
              className="px-8 py-4 bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white text-lg rounded-lg transition-colors font-semibold"
            >
              Watch Demo
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Free tier forever
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Build
            </h2>
            <p className="text-xl text-gray-400">
              From idea to production in minutes, not weeks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Code Generation</h3>
              <p className="text-gray-400">
                GPT-4 & Gemini powered. Just describe what you want and watch complete apps appear.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Preview</h3>
              <p className="text-gray-400">
                See your app running instantly. No build step, no waiting. Edit and preview live.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">One-Click Deploy</h3>
              <p className="text-gray-400">
                Deploy to Vercel with one click. Your app live in 60 seconds with a real URL.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-semibold text-white mb-2">Auto-Save</h3>
              <p className="text-gray-400">
                Never lose work. Auto-saves every 2 seconds. Full project history in the cloud.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">15+ Templates</h3>
              <p className="text-gray-400">
                Start with ready-made templates. Landing pages, dashboards, apps, and more.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e] hover:border-[#6366f1] transition-all">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-2">Export Anywhere</h3>
              <p className="text-gray-400">
                Download as ZIP. Open in VS Code. Deploy anywhere. No lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>3 projects</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>10 AI generations/day</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>5 deployments/day</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Community templates</span>
                </li>
              </ul>
              <Link
                href="/app"
                className="block w-full px-6 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white text-center rounded-lg transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="p-8 bg-gradient-to-b from-[#6366f1] to-[#5558e3] rounded-xl border-2 border-[#6366f1] relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-[#8b5cf6] text-white text-sm rounded-full font-semibold">
                  POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$20</span>
                <span className="text-gray-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white">
                  <span className="text-green-300 mt-1">✓</span>
                  <span><strong>Unlimited</strong> projects</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-green-300 mt-1">✓</span>
                  <span><strong>Unlimited</strong> AI generations</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-green-300 mt-1">✓</span>
                  <span><strong>Unlimited</strong> deployments</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-green-300 mt-1">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-green-300 mt-1">✓</span>
                  <span>Custom domains</span>
                </li>
              </ul>
              <Link
                href="/app"
                className="block w-full px-6 py-3 bg-white hover:bg-gray-100 text-[#6366f1] text-center rounded-lg transition-colors font-semibold"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Team Tier */}
            <div className="p-8 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$50</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Team workspace</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Collaboration</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Usage analytics</span>
                </li>
              </ul>
              <Link
                href="/app"
                className="block w-full px-6 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white text-center rounded-lg transition-colors font-medium"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <details className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                How does AI code generation work?
              </summary>
              <p className="mt-4 text-gray-400">
                We use GPT-4 and Gemini to understand your description and generate complete, production-ready Next.js applications. The AI writes TypeScript, React components, and Tailwind CSS - all best practices included.
              </p>
            </details>

            <details className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                Can I export my code?
              </summary>
              <p className="mt-4 text-gray-400">
                Yes! Download your project as a ZIP file anytime. Open it in VS Code, run npm install, and you have a fully working Next.js app. No lock-in.
              </p>
            </details>

            <details className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                What technology stack do you use?
              </summary>
              <p className="mt-4 text-gray-400">
                Next.js 16, React 18, TypeScript, and Tailwind CSS. Industry-standard, modern, and production-ready. Your apps will be fast, maintainable, and deployable anywhere.
              </p>
            </details>

            <details className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                Is there a free tier?
              </summary>
              <p className="mt-4 text-gray-400">
                Yes! The free tier includes 3 projects, 10 AI generations per day, and 5 deployments per day. Perfect for trying out the platform or building personal projects.
              </p>
            </details>

            <details className="p-6 bg-[#1f1f2e] rounded-xl border border-[#2a2a3e]">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                How is this different from Lovable/v0/etc?
              </summary>
              <p className="mt-4 text-gray-400">
                We offer the same core features (AI generation, preview, deploy) at a better price. Plus, we use multiple AI models (GPT-4 + Gemini) for better results and lower costs. Open architecture means you can export and own your code.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers building apps with AI
          </p>
          <Link
            href="/app"
            className="inline-block px-8 py-4 bg-[#6366f1] hover:bg-[#5558e3] text-white text-lg rounded-lg transition-colors font-semibold"
          >
            Start Building Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f2e] py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🚀</span>
                <span className="text-lg font-bold text-white">Lovable Clone</span>
              </div>
              <p className="text-gray-400 text-sm">
                Build apps with AI in minutes
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="/app" className="text-gray-400 hover:text-white">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/legal/cookies" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://twitter.com" className="text-gray-400 hover:text-white">Twitter</a></li>
                <li><a href="https://github.com" className="text-gray-400 hover:text-white">GitHub</a></li>
                <li><a href="mailto:support@lovable-clone.com" className="text-gray-400 hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1f1f2e] text-center text-gray-500 text-sm">
            © 2025 Lovable Clone. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
