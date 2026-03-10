import {
  experienceSections,
  faqs,
  footerLinks,
  heroStats,
  operatingNotes,
  pillars,
  showcaseCards,
  testimonials,
  workflowSteps,
} from "../components/landing/landingContent";

function SectionIntro({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#ff9d43]">{eyebrow}</p>
      <h2 className="mt-4 font-['Georgia','Times_New_Roman',serif] text-4xl leading-tight text-slate-50 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-pink-100/70 sm:text-xl">{description}</p>
    </div>
  );
}

function LandingPage() {
  return (
    <main className="relative overflow-hidden pb-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(236,72,153,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(251,146,60,0.12),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,0.12),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl space-y-24 px-6 pb-20 pt-12">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-shell rounded-[2.5rem] p-8 sm:p-10 lg:p-12">
            <span className="inline-flex items-center rounded-full border border-pink-200/20 bg-pink-500/10 px-4 py-1.5 text-sm font-medium text-pink-50/90">
              Courier shipping platform for growing brands
            </span>
            <h1 className="mt-7 max-w-4xl font-['Georgia','Times_New_Roman',serif] text-5xl leading-[0.95] text-slate-50 sm:text-6xl lg:text-7xl">
              Compare rates, book shipments, and track orders from one place.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-pink-100/72 sm:text-xl">
              Built for teams that want faster shipping decisions, smoother dispatch, and cleaner visibility across operations.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#start" className="rounded-full bg-[linear-gradient(90deg,#f04e98,#fb7b54)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95">
                Get Started
              </a>
              <a href="#workspace-flow" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-50 transition hover:border-pink-200/35 hover:bg-white/5">
                Explore Features
              </a>
            </div>
          </div>

          <div className="grid gap-5">
            <article className="card-modern rounded-[2rem] p-6 sm:p-7">
              <p className="text-sm uppercase tracking-[0.28em] text-pink-100/55">Why it works</p>
              <div className="mt-5 space-y-4">
                {operatingNotes.map((note) => (
                  <div key={note.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <p className="text-lg font-semibold text-slate-50">{note.title}</p>
                    <p className="mt-2 text-base leading-relaxed text-pink-100/68">{note.description}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <article key={stat.label} className="card-modern rounded-[1.75rem] p-5">
                  <p className="text-3xl font-semibold text-slate-50">{stat.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-pink-100/68">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace-flow" className="space-y-8">
          <SectionIntro
            eyebrow="Features"
            title="Everything needed to run shipping with less friction."
            description="A commercial shipping workflow focused on speed, visibility, and better courier decisions."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="card-modern rounded-[2rem] p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff9d43]">{pillar.eyebrow}</p>
                <h3 className="mt-4 text-3xl font-semibold leading-tight text-slate-50">{pillar.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-pink-100/68">{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionIntro
            eyebrow="Product"
            title="A clean interface for the work that matters every day."
            description="Rate comparison, shipment booking, and tracking visibility arranged into a sharper, easier product story."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {showcaseCards.map((card, index) => (
              <article key={card.title} className="card-modern rounded-[2rem] p-6">
                <div className="mb-8 flex h-40 items-end rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
                  <div className="w-full rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex items-center justify-between text-sm text-pink-100/55">
                      <span>View {index + 1}</span>
                      <span>Live</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10" />
                    <div className="mt-3 grid gap-2">
                      <div className="h-2 rounded-full bg-pink-400/40" />
                      <div className="h-2 w-4/5 rounded-full bg-white/10" />
                      <div className="h-2 w-3/5 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-slate-50">{card.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-pink-100/68">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow-story" className="space-y-8">
          <SectionIntro
            eyebrow="Workflow"
            title="A simple flow from order details to delivery updates."
            description="Keep rate checks, booking, and shipment follow-up connected in one clean process."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((item) => (
              <article key={item.step} className="card-modern rounded-[2rem] p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pink-200/20 bg-pink-500/10 text-sm font-semibold text-pink-50">
                  {item.step}
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-slate-50">{item.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-pink-100/68">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionIntro
            eyebrow="Use Cases"
            title="Useful across operations, support, and shipping leadership."
            description="One setup that helps different teams move faster with cleaner shipment visibility."
          />
          <div className="grid gap-6 xl:grid-cols-2">
            {experienceSections.map((section) => (
              <article key={section.id} id={section.id} className="card-modern rounded-[2rem] p-7 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff9d43]">{section.label}</p>
                <h3 className="mt-4 font-['Georgia','Times_New_Roman',serif] text-4xl leading-tight text-slate-50">{section.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-pink-100/68">{section.body}</p>
                <ul className="mt-6 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-4 text-base text-pink-50/90">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionIntro
            eyebrow="Proof"
            title="Clearer shipping workflows create stronger business confidence."
            description="The value is straightforward: quicker actions, cleaner visibility, and a better operating experience."
            align="center"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {testimonials.map((item) => (
              <article key={item.name} className="card-modern rounded-[2rem] p-7">
                <p className="font-['Georgia','Times_New_Roman',serif] text-3xl leading-relaxed text-slate-50">“{item.quote}”</p>
                <div className="mt-6">
                  <p className="text-lg font-semibold text-pink-50">{item.name}</p>
                  <p className="text-base text-pink-100/60">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <div className="card-modern rounded-[2rem] p-8 sm:p-10">
            <SectionIntro
              eyebrow="FAQ"
              title="Practical answers for the next stage of the product."
              description="Use the current experience as a base for a larger shipping dashboard, booking flow, or customer support panel."
            />
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-5 text-lg text-slate-100">
                <summary className="cursor-pointer font-semibold text-slate-50">{item.question}</summary>
                <p className="mt-3 leading-relaxed text-pink-100/68">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="start" className="hero-shell rounded-[2.5rem] p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#ff9d43]">Get Started</p>
          <h2 className="mt-5 max-w-4xl font-['Georgia','Times_New_Roman',serif] text-4xl leading-tight text-slate-50 sm:text-5xl">
            Manage shipping from one better-looking workspace.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-pink-100/72 sm:text-xl">
            A stronger commercial presentation for rate comparison, booking, and tracking workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/auth" className="rounded-full bg-[linear-gradient(90deg,#f04e98,#fb7b54)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95">
              Open workspace
            </a>
            <a href="#workspace-flow" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-50 transition hover:border-pink-200/35 hover:bg-white/5">
              View features
            </a>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-slate-950/35">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-['Georgia','Times_New_Roman',serif] text-4xl text-slate-50">IronManCourier</p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-pink-100/65">
              Shipping workspace for brands that want better courier decisions and clearer operations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-base text-pink-100/72 transition hover:text-pink-50">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
