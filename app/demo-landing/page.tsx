'use client'

import React, { useState } from 'react'
import Link from 'next/link'

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, hash: string) {
  const id = hash.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
] as const

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Lightning fast',
    description: 'Built for performance. Optimized bundles and minimal runtime for the best Core Web Vitals.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: 'Modern stack',
    description: 'React 18, TypeScript, and Tailwind CSS. Production-ready patterns and best practices.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: 'Beautiful UI',
    description: 'Carefully crafted components with soft shadows, gradients, and smooth animations.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Secure by default',
    description: 'Industry-standard security practices. SOC 2 compliant infrastructure.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: 'Scale effortlessly',
    description: 'From prototype to millions of users. Auto-scaling and global edge network.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.100.864l1.122 5.402M11.25 9.75h-1.5m0 0h1.5m-1.5 0v4.5m0-4.5h1.5m-1.5 0V9.75m-3 0h7.5v4.5m-7.5 0V9.75m0 0h-1.5m1.5 0v4.5m0-4.5h1.5m-1.5 0V9.75m0 0h-1.5m0 0H9.75" />
      </svg>
    ),
    title: 'Developer experience',
    description: 'Documentation, SDKs, and support. Ship faster with our tools and APIs.',
  },
]

const SERVICES = [
  { name: 'Web applications', description: 'Full-stack web apps with React and Node.' },
  { name: 'Mobile-first sites', description: 'Responsive, performant mobile experiences.' },
  { name: 'API & integrations', description: 'REST and GraphQL APIs, webhooks.' },
  { name: 'Dashboards & tools', description: 'Internal tools and analytics dashboards.' },
]

const TESTIMONIALS = [
  {
    quote: 'Barbar has transformed our marketing strategy. We saw a 50% increase in conversions!',
    name: 'Sarah Chen',
    role: 'Marketing Director, TechFlow',
    avatar: 'https://i.pravatar.cc/100?u=sarah',
  },
  {
    quote: 'The analytics tools are incredibly powerful. We can make data-driven decisions like never before.',
    name: 'Marcus Webb',
    role: 'CEO, StartUpInc',
    avatar: 'https://i.pravatar.cc/100?u=marcus',
  },
  {
    quote: "Barbar's automation features have saved us countless hours of work.",
    name: 'Priya Patel',
    role: 'CMO, Creatify',
    avatar: 'https://i.pravatar.cc/100?u=priya',
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 0,
    period: 'month',
    description: 'Perfect for side projects and experiments.',
    features: ['Up to 3 projects', '10K API calls/month', 'Community support', 'Basic templates'],
    cta: 'Get started free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For growing teams and production apps.',
    features: ['Unlimited projects', '100K API calls/month', 'Priority support', 'Advanced analytics', 'Custom domains'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'For large organizations with custom needs.',
    features: ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'SSO & audit logs', 'Custom contracts'],
    cta: 'Contact sales',
    highlighted: false,
  },
]

const FAQ_ITEMS = [
  { q: 'How do I get started?', a: 'Sign up for a free account, connect your repo or create a new project, and follow the onboarding. You can deploy your first app in under 5 minutes.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. Invoicing is available for Pro and Enterprise plans.' },
  { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time. You will retain access until the end of your billing period. No long-term contracts.' },
  { q: 'Do you offer support?', a: 'Starter includes community support. Pro and Enterprise include priority email support. Enterprise also gets dedicated Slack and onboarding calls.' },
  { q: 'Is my data secure?', a: 'Yes. We use encryption in transit and at rest, and are SOC 2 Type II compliant. You can export or delete your data at any time.' },
  { q: 'Can I use this for client work?', a: 'Yes. Pro and Enterprise plans include commercial use. You can build apps for yourself or for clients under the same subscription.' },
]

export default function DemoLandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 pointer-events-none" aria-hidden />

      {/* Navigation */}
      <header className="relative z-50 sticky top-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold text-xl tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                ◇
              </span>
              Product
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => scrollToSection(e, href)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, '#contact')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get started
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" aria-hidden />
              Now in public beta
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Build modern apps
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                in minutes, not months
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              The fastest way to go from idea to production. Modern stack, beautiful defaults, and deployment in one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, '#contact')}
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Start building free
              </a>
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, '#features')}
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 text-lg font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">No credit card required · Free tier forever</p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Features</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Everything you need to ship
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                A complete toolkit for building, deploying, and scaling modern applications.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature, i) => (
                <article
                  key={feature.title}
                  className="group p-8 rounded-3xl border border-slate-200 bg-slate-50/50 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300" aria-hidden>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">About us</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                  We help teams ship better software, faster
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Our platform combines the best of low-code speed with the flexibility of full code. Build production-ready applications with modern frameworks, without the usual setup and boilerplate.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Thousands of developers and teams use our tools to prototype, iterate, and deploy. We are backed by leading investors and are committed to keeping the core experience free forever.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 overflow-hidden shadow-2xl shadow-indigo-500/10">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Team collaboration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services / Product */}
        <section id="services" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Services</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                What you can build
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From landing pages to full applications. One platform, endless possibilities.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICES.map((service) => (
                <article
                  key={service.name}
                  className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Testimonials</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Loved by teams everywhere
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                See what our customers have to say about building with us.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300"
                >
                  <p className="text-slate-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="flex items-center gap-4">
                    <img src={t.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <cite className="not-italic font-bold text-slate-900">{t.name}</cite>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-slate-600">
                Start free. Upgrade when you need more.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {PRICING_TIERS.map((tier) => (
                <article
                  key={tier.name}
                  className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                    tier.highlighted
                      ? 'border-indigo-500 bg-gradient-to-b from-indigo-50 to-white shadow-xl shadow-indigo-500/20 scale-105'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  {tier.highlighted && (
                    <p className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                      Recommended
                    </p>
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                  <p className="text-slate-600 mb-6">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">${tier.price}</span>
                    <span className="text-slate-500">/{tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-700">
                        <span className="text-indigo-600" aria-hidden>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, '#contact')}
                    className={`block w-full py-3.5 rounded-xl text-center font-semibold transition-all duration-200 ${
                      tier.highlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                        : 'border-2 border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tier.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Frequently asked questions
              </h2>
            </div>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left"
                    aria-expanded={faqOpen === i}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                  >
                    <span className="font-semibold text-slate-900">{item.q}</span>
                    <span className="text-indigo-600 text-xl flex-shrink-0" aria-hidden>
                      {faqOpen === i ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-question-${i}`}
                    className={`border-t border-slate-100 ${faqOpen === i ? 'block' : 'hidden'}`}
                  >
                    <p className="p-6 pt-4 text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-slate-600">
              Can&apos;t find an answer?{' '}
              <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} className="text-indigo-600 font-semibold hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Contact</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Get in touch
              </h2>
              <p className="text-xl text-slate-600">
                Have a question or want to get started? We&apos;d love to hear from you.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Contact information</h3>
                <ul className="space-y-4 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Email:</strong>{' '}
                    <a href="mailto:hello@example.com" className="text-indigo-600 hover:underline">hello@example.com</a>
                  </li>
                  <li>
                    <strong className="text-slate-900">Phone:</strong>{' '}
                    <a href="tel:+15551234567" className="text-indigo-600 hover:underline">+1 (555) 123-4567</a>
                  </li>
                  <li>
                    <strong className="text-slate-900">Location:</strong> San Francisco, CA
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-lg">
                {formSubmitted ? (
                  <p className="text-slate-700 font-medium">Thanks! We&apos;ll get back to you soon.</p>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                        placeholder="How can we help?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-colors"
                    >
                      Send message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
                <span className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">◇</span>
                Product
              </Link>
              <p className="mt-4 text-sm text-slate-400">
                Build modern apps in minutes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')} className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" onClick={(e) => scrollToSection(e, '#faq')} className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#about" onClick={(e) => scrollToSection(e, '#about')} className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">𝕏</a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="GitHub">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">in</a>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Product. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
