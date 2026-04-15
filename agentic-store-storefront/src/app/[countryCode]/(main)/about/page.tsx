import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Byteshop",
  description: "Learn about Byteshop — our story, our team, and what we're building.",
}

const TEAM = [
  { name: "Alex Chen", role: "Co-founder & CEO", bio: "Previously led product at two YC-backed startups. Passionate about making AI useful for everyday people." },
  { name: "Jordan Park", role: "Co-founder & CTO", bio: "10 years building scalable e-commerce infrastructure. Believes great software should feel invisible." },
  { name: "Sam Rivera", role: "Head of Design", bio: "Crafts experiences that are simple on the surface and powerful underneath. Dog person." },
  { name: "Taylor Kim", role: "Head of Growth", bio: "Obsessed with building communities around products people genuinely love." },
]

const OPEN_ROLES = [
  { title: "Senior Full-Stack Engineer", team: "Engineering", location: "Remote" },
  { title: "AI / ML Engineer", team: "Engineering", location: "Remote" },
  { title: "Product Designer", team: "Design", location: "Remote / KL" },
  { title: "Growth Marketer", team: "Marketing", location: "Remote" },
  { title: "Customer Success Lead", team: "Operations", location: "Remote / KL" },
]

const PRESS = [
  {
    outlet: "TechCrunch",
    date: "March 2026",
    headline: "Byteshop raises $4M seed to bring AI shopping assistants to the masses",
    href: "#",
  },
  {
    outlet: "The Verge",
    date: "February 2026",
    headline: "Is this AI chatbot the future of online shopping? We tried it.",
    href: "#",
  },
  {
    outlet: "Product Hunt",
    date: "January 2026",
    headline: "#1 Product of the Day — Byteshop AI Shopping Assistant",
    href: "#",
  },
]

export default function AboutPage() {
  return (
    <div className="w-full bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="content-container relative py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Est. 2025
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none mb-6">
            Shopping, reimagined<br />
            <span style={{ background: "linear-gradient(90deg, #a78bfa, #6366f1, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              with AI
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            We&apos;re building the shopping experience we always wanted — one where an intelligent assistant understands what you need and helps you find it instantly.
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="content-container py-24 scroll-mt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">Our Story</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
            We got frustrated shopping online.<br />So we fixed it.
          </h2>
          <div className="flex flex-col gap-5 text-gray-500 text-base leading-relaxed">
            <p>
              Byteshop started in a small apartment in Kuala Lumpur in 2025. The two of us — Alex and Jordan — spent an embarrassing amount of time trying to find a decent birthday gift online. We filtered, scrolled, compared, and gave up. Three times.
            </p>
            <p>
              We knew AI was good enough to do better. So we built a prototype over a weekend: a chat interface that could understand natural language — &quot;something cosy for my sister who loves plants&quot; — and return actually useful results. Friends loved it. We kept building.
            </p>
            <p>
              Today, Byteshop is a full e-commerce platform with an AI assistant at its core. We stock over 500 products across categories, ship worldwide, and are growing our catalogue every week. Our goal is simple: make finding the right thing feel effortless.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-16 border-t border-gray-100">
          {[
            { value: "500+", label: "Products" },
            { value: "12k+", label: "Happy customers" },
            { value: "40+", label: "Countries shipped" },
            { value: "4.8★", label: "Average rating" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">The Team</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-10">People behind the product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, bio }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">{role}</p>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="bg-gray-50/70 border-y border-gray-100 scroll-mt-20">
        <div className="content-container py-24">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">Careers</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join us</h2>
            <p className="text-gray-400 text-base leading-relaxed">
              We&apos;re a small, fully remote team that ships fast and cares deeply about craft. If you want to build something people genuinely use every day, we&apos;d love to hear from you.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {OPEN_ROLES.map(({ title, team, location }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-xl px-6 py-5 flex items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{team} · {location}</p>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                  Apply →
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-8">
            Don&apos;t see a fit? Send your CV to <span className="text-indigo-600">careers@byteshop.com</span> — we&apos;re always open to exceptional people.
          </p>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="content-container py-24 scroll-mt-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">Press</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">In the news</h2>
          <p className="text-gray-400 text-base leading-relaxed">
            For press enquiries, interviews, or media assets, reach out to <span className="text-indigo-600">press@byteshop.com</span>.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {PRESS.map(({ outlet, date, headline, href }) => (
            <a
              key={headline}
              href={href}
              className="group border border-gray-100 rounded-xl px-6 py-5 flex items-start gap-6 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex-shrink-0 w-24 text-right">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">{outlet}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date}</p>
              </div>
              <div className="w-px bg-gray-100 self-stretch flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed group-hover:text-indigo-600 transition-colors font-medium">
                {headline}
              </p>
            </a>
          ))}
        </div>
      </section>

    </div>
  )
}
