'use client'

import React from 'react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden font-display">
      {/* Gradient mesh background (global) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[80vmax] h-[80vmax] rounded-full bg-[#6366f1]/20 blur-[120px] animate-gradient-shift" />
        <div className="absolute bottom-0 right-1/4 w-[60vmax] h-[60vmax] rounded-full bg-[#8b5cf6]/15 blur-[100px] animate-gradient-shift" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-[40vmax] h-[40vmax] rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#050508_40%,#050508_100%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/[0.06] bg-[#050508]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300">◇</span>
              <span className="text-xl font-bold tracking-tight text-white">Appfactory</span>
            </Link>
            <div className="flex items-center gap-10">
              <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-indigo-400 after:transition-all hover:after:w-full">Features</Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-indigo-400 after:transition-all hover:after:w-full">Pricing</Link>
              <Link href="#about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-indigo-400 after:transition-all hover:after:w-full">About</Link>
              <Link href="#faq" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-indigo-400 after:transition-all hover:after:w-full">FAQ</Link>
              <Link href="#contact" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-indigo-400 after:transition-all hover:after:w-full">Contact</Link>
              <Link
                href="/app"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.06] mb-10 animate-fade-in-up opacity-0 stagger-1 shadow-lg shadow-black/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
            <span className="text-sm font-medium text-gray-300">AI-powered development — no code required</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8 animate-fade-in-up opacity-0 stagger-2">
            <span className="text-white drop-shadow-sm">Build apps</span>
            <br />
            <span className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]">in minutes</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-fade-in-up opacity-0 stagger-3 leading-relaxed">
            Describe your app in plain English. Get production-ready code, live preview, and one-click deploy. Like Lovable — but yours to own.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 stagger-4">
            <Link
              href="/app"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-lg font-semibold shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/55 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
            >
              Start building free →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-2xl border-2 border-white/20 bg-white/5 text-white text-lg font-semibold hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-8 animate-fade-in-up opacity-0 stagger-5">
            No credit card · Free tier forever
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 py-16 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { value: '10k+', label: 'Apps built' },
              { value: '50+', label: 'Templates' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<60s', label: 'To deploy' },
            ].map((stat, i) => (
              <div key={stat.label} className="animate-fade-in-up opacity-0 stagger-6" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Bento grid */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Everything you need to ship
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From idea to production in minutes, not weeks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large feature — spans 2 cols on lg */}
            <div className="lg:col-span-2 p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 group shadow-xl shadow-black/5">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
                  🤖
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI code generation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    GPT-4 & Gemini powered. Describe what you want — get a full React + TypeScript app with Tailwind. Production-ready structure, components, and styling.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/10 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                  <div className="flex gap-2 items-end h-10">
                    <span className="w-8 rounded bg-indigo-500/60" style={{ height: '60%' }} />
                    <span className="w-8 rounded bg-violet-500/60" style={{ height: '100%' }} />
                    <span className="w-8 rounded bg-indigo-500/40" style={{ height: '40%' }} />
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-white/10 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Output</p>
                  <p className="text-sm text-gray-400 font-mono">App.tsx · 12 files</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4" aria-hidden>👁️</div>
              <h3 className="text-xl font-bold text-white mb-2">Real-time preview</h3>
              <p className="text-gray-400">
                See your app in the browser instantly. Edit and refresh — no build step. Tailwind-powered preview so designs look exactly right.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-white mb-2">One-click deploy</h3>
              <p className="text-gray-400">
                Push to Vercel in one click. Get a live URL in under a minute. No config, no servers.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4">💾</div>
              <h3 className="text-xl font-bold text-white mb-2">Auto-save & history</h3>
              <p className="text-gray-400">
                Every change saved to the cloud. Never lose work. Full project history.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">Templates</h3>
              <p className="text-gray-400">
                Start from landing pages, dashboards, and SaaS layouts. Customize with AI.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-[#6366f1]/50 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">Export anywhere</h3>
              <p className="text-gray-400">
                Download as ZIP. Open in VS Code. Deploy anywhere. No lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/5">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['3 projects', '10 AI generations/day', '5 deployments/day', 'Community templates'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block w-full py-3.5 rounded-xl border border-white/15 bg-white/5 text-white text-center font-semibold hover:bg-white/10 transition-colors">
                Get started
              </Link>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#6366f1]/25 to-[#8b5cf6]/25 border-2 border-[#6366f1]/60 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-shadow duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-semibold shadow-lg shadow-indigo-500/40">
                Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$20</span>
                <span className="text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited projects', 'Unlimited AI generations', 'Unlimited deployments', 'Priority support', 'Custom domains'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white">
                    <span className="text-emerald-300">✓</span> <strong>{item}</strong>
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block w-full py-3.5 rounded-xl bg-white text-[#6366f1] text-center font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-200">
                Start free trial
              </Link>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/5">
              <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$50</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'Team workspace', 'Collaboration', 'Usage analytics'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block w-full py-3.5 rounded-xl border border-white/15 bg-white/5 text-white text-center font-semibold hover:bg-white/10 transition-colors">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">About us</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                We help you ship products, not code
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-6">
                Appfactory was built so anyone can turn an idea into a real app — without learning frameworks or waiting on dev teams. We combine AI code generation with instant preview and one-click deploy so you can iterate in minutes.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                Our mission is simple: make building software as easy as describing it. Whether you need a landing page, a dashboard, or a full SaaS prototype, you get production-ready React and Tailwind code you can own and deploy anywhere.
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 text-xl">◇</span>
                  <span className="text-white font-semibold">AI-first</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 text-xl">◇</span>
                  <span className="text-white font-semibold">No lock-in</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Projects shipped', value: '10k+' },
                { label: 'Templates', value: '50+' },
                { label: 'Uptime', value: '99.9%' },
                { label: 'Support', value: '24/7' },
              ].map((item) => (
                <div key={item.label} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-indigo-500/30 transition-colors">
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — fancy accordion */}
      <section id="faq" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about building with Appfactory
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'How does AI code generation work?', a: 'We use GPT-4 and Gemini to understand your description and generate complete, production-ready apps. The AI writes React, TypeScript, and Tailwind — best practices included.' },
              { q: 'Can I export my code?', a: 'Yes. Download your project as a ZIP anytime. Open in VS Code, run npm install, and deploy anywhere. No lock-in.' },
              { q: 'What stack do you use?', a: 'React, TypeScript, Vite, and Tailwind CSS. Your apps are fast, maintainable, and deployable anywhere.' },
              { q: 'Is there a free tier?', a: 'Yes. Free includes 3 projects, 10 AI generations per day, and 5 deployments per day.' },
              { q: 'How is this different from Lovable / v0?', a: 'Same core idea: describe an app, get code and preview. We use multiple models, offer export and ownership, and you can self-host or deploy to Vercel with one click.' },
              { q: 'Do you offer support?', a: 'Free tier includes community support. Pro and Team plans get priority email support and optional custom help.' },
            ].map((faq, i) => (
              <details
                key={faq.q}
                className="group p-6 rounded-2xl border-2 border-white/10 bg-white/[0.03] hover:border-white/20 [&[open]]:border-indigo-500/50 [&[open]]:bg-gradient-to-br [&[open]]:from-indigo-500/10 [&[open]]:to-transparent transition-all duration-300 [&[open]_summary_svg]:rotate-180 shadow-xl shadow-black/5"
              >
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <span className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <span className="text-lg font-semibold text-white">{faq.q}</span>
                  </span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 ml-11 text-gray-400 leading-relaxed pl-0 md:pl-0">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 sm:p-20 rounded-3xl border-2 border-white/10 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 relative overflow-hidden shadow-2xl shadow-indigo-500/10">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.12) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <h2 className="relative text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to build something amazing?
            </h2>
            <p className="relative text-xl text-gray-400 mb-12">
              Join developers shipping apps with AI
            </p>
            <Link
              href="/app"
              className="relative inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-lg font-semibold shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
            >
              Start building free →
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">Contact us</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                Get in touch
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Have a question or want to start a project? Send us a message and we’ll get back to you quickly.
              </p>
              <div className="space-y-6">
                <a href="mailto:support@appfactory.example.com" className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-indigo-500/30 transition-colors">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400">✉</span>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-white font-medium">support@appfactory.example.com</div>
                  </div>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-indigo-500/30 transition-colors">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400">𝕏</span>
                  <div>
                    <div className="text-sm text-gray-500">Twitter</div>
                    <div className="text-white font-medium">@appfactory</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="p-8 sm:p-10 rounded-3xl border-2 border-white/10 bg-white/[0.03] shadow-2xl shadow-black/10">
              <h3 className="text-xl font-bold text-white mb-6">Send a message</h3>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" aria-hidden />
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-lg shadow-lg shadow-indigo-500/20">◇</span>
                <span className="text-lg font-bold text-white">Appfactory</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Build apps with AI in minutes
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-5">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="text-gray-500 hover:text-white hover:underline transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-500 hover:text-white hover:underline transition-colors">Pricing</Link></li>
                <li><Link href="#about" className="text-gray-500 hover:text-white hover:underline transition-colors">About</Link></li>
                <li><Link href="#faq" className="text-gray-500 hover:text-white hover:underline transition-colors">FAQ</Link></li>
                <li><Link href="#contact" className="text-gray-500 hover:text-white hover:underline transition-colors">Contact</Link></li>
                <li><Link href="/app" className="text-gray-500 hover:text-white hover:underline transition-colors">Get started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-5">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/legal/terms" className="text-gray-500 hover:text-white hover:underline transition-colors">Terms</Link></li>
                <li><Link href="/legal/privacy" className="text-gray-500 hover:text-white hover:underline transition-colors">Privacy</Link></li>
                <li><Link href="/legal/cookies" className="text-gray-500 hover:text-white hover:underline transition-colors">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-5">Connect</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="https://twitter.com" className="text-gray-500 hover:text-white hover:underline transition-colors" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                <li><a href="https://github.com" className="text-gray-500 hover:text-white hover:underline transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="mailto:support@example.com" className="text-gray-500 hover:text-white hover:underline transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/[0.06] text-center text-gray-500 text-sm">
            © 2025 Appfactory. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
