'use client'

import React from 'react'
import Link from 'next/link'

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, hash: string) {
  const id = hash.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
] as const

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

      {/* Header */}
      <header className="relative z-50 sticky top-0">
        <nav className="border-b border-white/[0.08] bg-[#050508]/98 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" aria-hidden />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" aria-hidden />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between min-h-[5.5rem]">
              <Link href="/" className="flex items-center gap-3.5 group">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-xl shadow-lg shadow-indigo-500/35 group-hover:shadow-indigo-500/55 group-hover:scale-105 transition-all duration-300 ring-2 ring-white/5">◇</span>
                <span className="text-xl font-bold tracking-tight text-white">Appfactory</span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2">
                {navLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => scrollToSection(e, href)}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 py-2.5 px-4 rounded-xl hover:bg-white/[0.06] hover:border-white/10 border border-transparent"
                  >
                    {label}
                  </a>
                ))}
                <Link
                  href="/app"
                  className="ml-2 sm:ml-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-semibold shadow-lg shadow-indigo-500/35 hover:shadow-indigo-500/55 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-indigo-400/30 hover:border-indigo-300/40"
                >
                  Get Started →
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

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

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Everything you need to ship
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From idea to production in minutes, not weeks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Hero feature card — spans 2 cols */}
            <div className="lg:col-span-2 group relative p-8 sm:p-10 rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-indigo-500/40 hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.4)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30 group-hover:scale-110 group-hover:shadow-indigo-500/50 transition-all duration-300">
                  🤖
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">AI code generation</h3>
                  <p className="text-gray-400 leading-relaxed text-lg">
                    GPT-4 & Gemini powered. Describe what you want — get a full React + TypeScript app with Tailwind. Production-ready structure, components, and styling.
                  </p>
                </div>
              </div>
              <div className="relative mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-500/20 p-5">
                  <p className="text-xs font-semibold text-indigo-300/90 uppercase tracking-wider mb-3">Preview</p>
                  <div className="flex gap-2 items-end h-12">
                    <span className="w-10 rounded-lg bg-indigo-500/70" style={{ height: '55%' }} />
                    <span className="w-10 rounded-lg bg-violet-500/70" style={{ height: '100%' }} />
                    <span className="w-10 rounded-lg bg-indigo-400/50" style={{ height: '45%' }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/20 p-5">
                  <p className="text-xs font-semibold text-violet-300/90 uppercase tracking-wider mb-3">Output</p>
                  <p className="text-sm text-gray-300 font-mono">App.tsx · 12 files</p>
                </div>
              </div>
            </div>

            {[
              { icon: '👁️', title: 'Real-time preview', desc: 'See your app in the browser instantly. Edit and refresh — no build step. Tailwind-powered preview so designs look exactly right.' },
              { icon: '🚀', title: 'One-click deploy', desc: 'Push to Vercel in one click. Get a live URL in under a minute. No config, no servers.' },
              { icon: '💾', title: 'Auto-save & history', desc: 'Every change saved to the cloud. Never lose work. Full project history.' },
              { icon: '📋', title: 'Templates', desc: 'Start from landing pages, dashboards, and SaaS layouts. Customize with AI.' },
              { icon: '📦', title: 'Export anywhere', desc: 'Download as ZIP. Open in VS Code. Deploy anywhere. No lock-in.' },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group p-8 rounded-3xl border-2 border-white/10 bg-white/[0.03] hover:border-indigo-500/30 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:from-indigo-500/30 group-hover:to-violet-500/30 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
      <section id="about" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">About us</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              We help you ship products, not code
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From idea to production — no frameworks to learn, no dev teams to wait on.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-indigo-500/10 group">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Team collaboration"
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                  <p className="text-white/90 font-semibold text-lg">Built by builders, for builders</p>
                  <p className="text-gray-400 text-sm mt-1">Real apps, real fast</p>
                </div>
              </div>
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-2xl" />
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <p className="text-lg text-gray-400 leading-relaxed">
                Appfactory was built so anyone can turn an idea into a real app — without learning frameworks or waiting on dev teams. We combine AI code generation with instant preview and one-click deploy so you can iterate in minutes.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                Our mission is simple: make building software as easy as describing it. Whether you need a landing page, a dashboard, or a full SaaS prototype, you get production-ready React and Tailwind code you can own and deploy anywhere.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg">◇</span>
                  <span className="text-white font-semibold">AI-first</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 text-lg">◇</span>
                  <span className="text-white font-semibold">No lock-in</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 text-lg">✓</span>
                  <span className="text-white font-semibold">Export & own</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { label: 'Projects shipped', value: '10k+' },
                  { label: 'Templates', value: '50+' },
                  { label: 'Uptime', value: '99.9%' },
                  { label: 'Support', value: '24/7' },
                ].map((item) => (
                  <div key={item.label} className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-300">
                    <div className="text-2xl font-bold text-white">{item.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" aria-hidden />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about building with Appfactory
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
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
                className="group p-6 sm:p-7 rounded-2xl border-2 border-white/10 bg-white/[0.04] hover:border-white/20 [&[open]]:border-indigo-500/40 [&[open]]:bg-gradient-to-br [&[open]]:from-indigo-500/15 [&[open]]:to-violet-500/5 [&[open]]:shadow-lg [&[open]]:shadow-indigo-500/10 transition-all duration-300 [&[open]_summary_svg]:rotate-180"
              >
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <span className="flex items-center gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-300 flex items-center justify-center text-sm font-bold border border-white/10">
                      {i + 1}
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-white">{faq.q}</span>
                  </span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-5 ml-14 text-gray-400 leading-relaxed">{faq.a}</p>
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
      <footer className="relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" aria-hidden />
        <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 lg:gap-16">
              <div className="md:col-span-1">
                <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300 ring-2 ring-white/5">◇</span>
                  <span className="text-xl font-bold text-white">Appfactory</span>
                </Link>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  Build production-ready apps with AI in minutes. No code required.
                </p>
                <div className="flex gap-3 mt-6">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all" aria-label="Twitter">𝕏</a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all font-bold" aria-label="GitHub">G</a>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider text-gray-400">Product</h3>
                <ul className="space-y-4 text-sm">
                  {navLinks.map(({ href, label }) => (
                    <li key={href}>
                      <a href={href} onClick={(e) => scrollToSection(e, href)} className="text-gray-400 hover:text-white transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                  <li><Link href="/app" className="text-gray-400 hover:text-white transition-colors">Get started</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider text-gray-400">Legal</h3>
                <ul className="space-y-4 text-sm">
                  <li><Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
                  <li><Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="/legal/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider text-gray-400">Contact</h3>
                <ul className="space-y-4 text-sm">
                  <li><a href="mailto:support@example.com" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                  <li><a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} className="text-gray-400 hover:text-white transition-colors">Get in touch</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-20 pt-10 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">
                © 2025 Appfactory. All rights reserved.
              </p>
              <p className="text-gray-600 text-xs">
                Built with AI · Deploy anywhere
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
