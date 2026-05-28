import Link from "next/link";
import { QrCode, BarChart3, Globe, Zap, Shield, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-[#e7e0d8]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <span className="text-cream font-bold text-sm font-heading">P</span>
            </div>
            <span className="font-semibold text-text text-lg">Plate</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#4a3f35]">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#4a3f35] hover:text-text transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#c44a2a] transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-gold/10 text-gold text-sm font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap size={14} />
          No app downloads required
        </div>
        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-text leading-tight mb-6">
          Your menu,<br />
          <span className="text-primary">one scan away</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Give your restaurant, food truck, or pop-up a beautiful digital menu. Customers scan a QR
          code, you control the content — update prices and items instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-primary text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-[#c44a2a] transition-colors shadow-lg shadow-primary/20"
          >
            Start free — 14 days trial
          </Link>
          <a
            href="#how-it-works"
            className="border-2 border-secondary text-secondary font-semibold px-8 py-4 rounded-xl text-lg hover:bg-secondary/10 transition-colors"
          >
            See how it works
          </a>
        </div>
        <p className="text-sm text-muted mt-4">No credit card required</p>

        {/* Hero mockup */}
        <div className="mt-16">
          <div className="bg-[#f5f1eb] rounded-3xl border border-[#e7e0d8] p-8 max-w-3xl mx-auto shadow-xl">
            <div className="flex items-start gap-8 justify-center">
              {/* Phone mockup */}
              <div className="bg-text rounded-3xl p-3 w-44 shadow-2xl">
                <div className="bg-cream rounded-2xl overflow-hidden">
                  <div className="bg-secondary px-3 py-4 text-white">
                    <div className="text-xs font-medium opacity-80">The Grand Table</div>
                    <div className="text-sm font-bold">Dinner Menu</div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wide">Starters</div>
                    {["Bruschetta — $12", "Soup du jour — $9", "Burrata — $16"].map((item) => (
                      <div key={item} className="text-[10px] text-[#4a3f35] py-1 border-b border-[#e7e0d8]">{item}</div>
                    ))}
                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wide pt-1">Mains</div>
                    {["Grilled salmon — $28", "Filet mignon — $42"].map((item) => (
                      <div key={item} className="text-[10px] text-[#4a3f35] py-1 border-b border-[#e7e0d8]">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
              {/* QR code */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <div className="w-32 h-32 bg-text rounded-xl flex items-center justify-center">
                  <QrCode size={80} className="text-cream" />
                </div>
                <p className="text-xs text-muted text-center">Scan to open menu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#f5f1eb] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-4xl font-bold text-text text-center mb-4">
            Up and running in minutes
          </h2>
          <p className="text-muted text-center mb-14 text-lg">Three steps to your digital menu</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                bg: "bg-primary",
                title: "Create your menu",
                desc: "Add your restaurant info, create categories, and list your items with photos, descriptions, and prices.",
              },
              {
                step: "2",
                bg: "bg-secondary",
                title: "Get your QR code",
                desc: "We generate a unique QR code for each menu. Download it and print it on table cards, receipts, or your window.",
              },
              {
                step: "3",
                bg: "bg-gold",
                title: "Customers scan & order",
                desc: "Guests scan with any smartphone camera — no app needed. Your menu loads instantly in their browser.",
              },
            ].map(({ step, bg, title, desc }) => (
              <div key={step} className="text-center">
                <div className={`w-12 h-12 ${bg} text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 font-heading`}>
                  {step}
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">{title}</h3>
                <p className="text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-4xl font-bold text-text text-center mb-4">
            Everything you need
          </h2>
          <p className="text-muted text-center mb-14 text-lg">
            Built for real restaurants, food trucks, and independent chefs
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <QrCode size={22} />,
                iconBg: "bg-primary/10 text-primary",
                title: "Instant QR codes",
                desc: "Generate and download print-ready QR codes for each menu. Update your menu anytime — the QR code stays the same.",
              },
              {
                icon: <Smartphone size={22} />,
                iconBg: "bg-secondary/10 text-secondary",
                title: "Mobile-first menus",
                desc: "Beautiful, fast-loading menus optimized for every phone. No app download required for your customers.",
              },
              {
                icon: <Zap size={22} />,
                iconBg: "bg-gold/10 text-gold",
                title: "Real-time updates",
                desc: "Sold out of the special? Update your menu instantly. Changes go live immediately — no reprinting.",
              },
              {
                icon: <BarChart3 size={22} />,
                iconBg: "bg-primary/10 text-primary",
                title: "Menu analytics",
                desc: "See how many times your QR code has been scanned. Understand which menus are getting the most views.",
              },
              {
                icon: <Globe size={22} />,
                iconBg: "bg-secondary/10 text-secondary",
                title: "Multiple menus",
                desc: "Separate menus for lunch, dinner, and drinks. Each gets its own QR code. Switch them active or inactive anytime.",
              },
              {
                icon: <Shield size={22} />,
                iconBg: "bg-gold/10 text-gold",
                title: "Dietary labels",
                desc: "Mark items as vegan, vegetarian, gluten-free, or spicy. Help your guests make informed choices.",
              },
            ].map(({ icon, iconBg, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-[#e7e0d8] hover:border-gold/50 hover:shadow-md transition-all bg-white/40">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  {icon}
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
                <p className="text-muted leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#f5f1eb] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-4xl font-bold text-text text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted text-center mb-14 text-lg">Start free for 14 days. No credit card required.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$19",
                desc: "Perfect for single-location restaurants",
                features: ["1 menu", "Up to 30 items", "QR code generation", "Basic analytics", "Email support"],
                cta: "Start free trial",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$39",
                desc: "For growing restaurants and food trucks",
                features: [
                  "Unlimited menus",
                  "Unlimited items",
                  "Photo uploads",
                  "Advanced analytics",
                  "Custom branding",
                  "Multi-language",
                  "Priority support",
                ],
                cta: "Start free trial",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "$79",
                desc: "For chains and hospitality groups",
                features: [
                  "Everything in Pro",
                  "Team management",
                  "API access",
                  "White-label",
                  "Dedicated support",
                  "Custom integrations",
                ],
                cta: "Start free trial",
                highlight: false,
              },
            ].map(({ name, price, desc, features, cta, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-8 ${
                  highlight
                    ? "bg-secondary shadow-2xl shadow-secondary/30 scale-105"
                    : "bg-cream border border-[#e7e0d8]"
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-1 ${highlight ? "text-white" : "text-text"}`}>
                    {name}
                  </h3>
                  <div className={`text-4xl font-bold mb-1 font-heading ${highlight ? "text-white" : "text-text"}`}>
                    {price}<span className={`text-lg font-normal ${highlight ? "text-white/70" : "text-muted"}`}>/mo</span>
                  </div>
                  <p className={`text-sm ${highlight ? "text-white/70" : "text-muted"}`}>{desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? "text-white/90" : "text-[#4a3f35]"}`}>
                      <svg className="w-4 h-4 shrink-0 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    highlight
                      ? "bg-gold text-white hover:bg-[#a67c30]"
                      : "bg-primary text-white hover:bg-[#c44a2a]"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-cream mb-4">
            Ready to go digital?
          </h2>
          <p className="text-xl text-cream/70 mb-8">
            Join hundreds of restaurants already using Plate. Set up your first menu in under 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gold text-white font-semibold px-10 py-4 rounded-xl text-lg hover:bg-[#a67c30] transition-colors shadow-lg shadow-black/20"
          >
            Create your free menu
          </Link>
          <p className="text-sm text-cream/50 mt-3">14-day free trial. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e7e0d8] bg-cream py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center">
              <span className="text-cream font-bold text-xs font-heading">P</span>
            </div>
            <span className="font-semibold text-text">Plate</span>
          </div>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} Plate by RomeDigital. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted">
            <a href="#" className="hover:text-[#4a3f35] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#4a3f35] transition-colors">Terms</a>
            <a href="mailto:support@romedigital.tech" className="hover:text-[#4a3f35] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
