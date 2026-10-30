"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import s from "./how-it-works.module.css";

type Step = { title: string; body: string };

/** Must match the desktop breakpoint in how-it-works.module.css. */
const DESKTOP = "(min-width: 900px)";
type Rate = { name: string; price: string };

/**
 * Scroll-driven sticky stepper. On desktop a sticky panel beside the steps
 * shows a mock screen for whichever step is crossing the middle of the
 * viewport; on a phone the panel shrinks to a strip under the header and the
 * steps scroll beneath it.
 *
 * The cards are illustrations, not UI — they're aria-hidden and the steps
 * carry the content. Card 1 uses real catalogue rows; cards 2 and 3 are
 * placeholder figures.
 */
export function HowItWorks({
  heading,
  steps,
  rates,
  children,
}: {
  heading: React.ReactNode;
  steps: Step[];
  rates: Rate[];
  /** Rendered below the steps — the CTA. */
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => steps.map(() => false));

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Active step: only the one crossing a thin band of the viewport. Desktop
  // uses the middle 10%; on a phone the sticky panel covers the top half, so
  // the band drops to 55–65% — just below the panel, above the tab bar.
  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLLIElement => el !== null);
    const mq = window.matchMedia(DESKTOP);
    let observer: IntersectionObserver | undefined;

    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(els.indexOf(entry.target as HTMLLIElement));
          }
        },
        { rootMargin: mq.matches ? "-45% 0px -45% 0px" : "-55% 0px -35% 0px" },
      );
      els.forEach((el) => observer!.observe(el));
    };

    observe();
    mq.addEventListener("change", observe);
    return () => {
      mq.removeEventListener("change", observe);
      observer?.disconnect();
    };
  }, []);

  // Progress line, its dots, and the page progress bar
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const track = trackRef.current;
      const line = lineRef.current;
      if (!section || !track || !line) return;

      // The line's tip sits at the bottom edge of the active band
      const tip = window.innerHeight * (window.matchMedia(DESKTOP).matches ? 0.55 : 0.65);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) {
        barRef.current.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
      }

      const centres = dotRefs.current.map((d) => {
        if (!d) return 0;
        const r = d.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      const first = centres[0];
      const last = centres[centres.length - 1];
      const trackTop = track.getBoundingClientRect().top;
      line.style.top = `${first - trackTop}px`;
      line.style.height = `${last - first}px`;

      const p = Math.min(1, Math.max(0, (tip - first) / (last - first || 1)));
      section.style.setProperty("--progress", p.toFixed(4));

      const next = centres.map((c) => c <= tip + 1);
      setPassed((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    // Web fonts change text height, which moves the dots
    document.fonts?.ready.then(request);
    update();

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(frame);
    };
  }, []);

  const tick = (
    <svg viewBox="0 0 16 16">
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  );

  // Which rate rows are ticked, and in what order they tick
  const checked = [0, 1, 3];

  return (
    <section
      id="how"
      ref={sectionRef}
      aria-labelledby="how-title"
      data-active={active + 1}
      className={cn(s.section, "scroll-mt-24")}
    >
      <div className={s.pageBar} aria-hidden="true">
        <span ref={barRef} />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <h2 id="how-title" className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          {heading}
        </h2>

        <nav aria-label="Jump to a step">
          <ul className={s.jump}>
            {steps.map((step, i) => (
              <li key={step.title}>
                <a href={`#how-step-${i + 1}`}>
                  0{i + 1} {step.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.inner}>
          {/* Sticky panel — decorative, the steps carry the content */}
          <div className={s.visual} aria-hidden="true">
            <div className={s.cards}>
              {/* Card 1 — rate card */}
              <div className={cn(s.card, active === 0 && s.isActive)}>
                <p className={s.cardTitle}>Rate card</p>
                <p className={s.cardSub}>Tap what you&apos;ve got</p>
                <ul className={s.rateList}>
                  {rates.map((rate, i) => {
                    const order = checked.indexOf(i);
                    return (
                      <li
                        key={rate.name}
                        className={cn(s.rateRow, order >= 0 && s.isChecked)}
                        style={{ "--i": Math.max(order, 0) } as React.CSSProperties}
                      >
                        <span className={s.box}>{tick}</span>
                        <span className={s.rateName}>{rate.name}</span>
                        <span className={s.rate}>{rate.price}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className={s.cardFoot}>
                  <span>In your crate</span>
                  <span>{checked.filter((i) => i < rates.length).length} items</span>
                </div>
              </div>

              {/* Card 2 — date and window picker (placeholder figures) */}
              <div className={cn(s.card, active === 1 && s.isActive)}>
                <p className={s.cardTitle}>Pick a window</p>
                <p className={s.cardSub}>45-minute windows · 9am–6pm</p>
                <div className={s.dates}>
                  {[
                    ["Thu", "31"],
                    ["Fri", "1"],
                    ["Sat", "2"],
                    ["Sun", "3"],
                    ["Mon", "4"],
                  ].map(([day, date], i) => (
                    <div key={day} className={cn(s.date, i === 1 && s.isPicked)}>
                      {day}
                      <b>{date}</b>
                    </div>
                  ))}
                </div>
                <div className={s.slots}>
                  {[
                    { t: "9:00 – 9:45", full: true },
                    { t: "9:45 – 10:30" },
                    { t: "10:30 – 11:15", picked: true },
                    { t: "11:15 – 12:00" },
                    { t: "12:00 – 12:45" },
                    { t: "12:45 – 1:30", full: true },
                  ].map((slot) => (
                    <div
                      key={slot.t}
                      className={cn(s.slot, slot.full && s.isFull, slot.picked && s.isPicked)}
                    >
                      {slot.t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3 — payment confirmation (placeholder figures) */}
              <div className={cn(s.card, active === 2 && s.isActive)}>
                <p className={s.cardTitle}>Payment received via UPI</p>
                <p className={s.cardSub}>Weighed at your door · Fri, 10:52am</p>
                <div className={s.paidHead}>
                  <p className={cn(s.paidAmount, "readout")}>₹486</p>
                  <span className={s.badge}>
                    {tick}
                    Paid
                  </span>
                </div>
                <ul className={s.receipt}>
                  <li><span>Newspaper · 12.4 kg</span><span>₹174</span></li>
                  <li><span>Cardboard · 8.0 kg</span><span>₹80</span></li>
                  <li><span>Iron · 8.3 kg</span><span>₹232</span></li>
                </ul>
                <p className={s.upiRef}>UPI ref 4183 9920 1174</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className={s.track} ref={trackRef}>
            <span className={s.line} ref={lineRef} aria-hidden="true">
              <span className={s.lineFill} />
            </span>
            <ol className={s.steps}>
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  id={`how-step-${i + 1}`}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  aria-current={active === i ? "step" : undefined}
                  className={cn(s.step, active === i && s.isActive, passed[i] && s.isPassed)}
                >
                  <div className={s.stepContent}>
                    <span
                      className={s.dot}
                      aria-hidden="true"
                      ref={(el) => {
                        dotRefs.current[i] = el;
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className={s.stepText}>
                      <span className={s.num} aria-hidden="true">
                        0{i + 1}
                      </span>
                      <h3 className={s.stepTitle}>{step.title}</h3>
                      <p className={s.stepBody}>{step.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
