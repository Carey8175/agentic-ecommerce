import { retrieveCart } from "@lib/data/cart"
import AgentPanel from "./agent-panel"

export default async function HeroSection() {
  const cart = await retrieveCart().catch(() => null)

  return (
    <div
      className="w-full py-20 px-4 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1f 50%, #0d0d1a 100%)" }}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">AI-Powered Shopping</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl small:text-5xl font-extrabold text-white text-center leading-tight mb-3 tracking-tight">
        Shop smarter with
      </h1>
      <h1 className="text-4xl small:text-5xl font-extrabold text-center leading-tight mb-6 tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
        AI assistance
      </h1>
      <p className="text-sm text-white/40 text-center max-w-sm mb-10">
        Describe what you&apos;re looking for and let our AI find the perfect match for you.
      </p>

      {/* Embedded agent panel */}
      <div className="w-full max-w-2xl h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-white/8">
        <AgentPanel mode="hero" cartId={cart?.id ?? null} />
      </div>

      {/* Stats */}
      <div className="flex gap-12 mt-10">
        {[["500+", "PRODUCTS"], ["AI", "RECOMMENDATIONS"], ["24/7", "ASSISTANCE"]].map(([val, label]) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold text-white">{val}</p>
            <p className="text-[9px] font-semibold tracking-widest text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
