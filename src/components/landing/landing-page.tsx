"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { homeForRole } from "@/lib/navigation";
import { useAppSelector } from "@/store";
import styles from "./landing.module.css";

const navigation = [
  ["Home", "#home"], ["About us", "#about"], ["Services", "#services"],
  ["Partners", "#partners"], ["Contact", "#contact"],
] as const;

const services = [
  { number: "01", title: "Transport for your team", text: "From a client meeting to a day in the field. Coordinate work trips with a pickup, a destination, and a clear approval process.", tag: "Employee journeys", className: "transport" },
  { number: "02", title: "A clearer view of every trip", text: "Bring requests, rider assignments, and live trip tracking into one workspace. Keep your team in the loop as journeys unfold.", tag: "Fleet & dispatch", className: "tracking" },
  { number: "03", title: "Less admin. More clarity.", text: "Keep trip records, transport costs, and company invoices together. Give your operations and finance teams a shared picture.", tag: "Reports & billing", className: "billing" },
];

const questions = [
  { question: "How do I request a trip as an employee?", answer: "First, ask your company’s transport coordinator to confirm that you’re enrolled and that your phone number is registered. Send your pickup, destination, and preferred time to the company’s designated booking WhatsApp number. Review the trip details and confirm to submit it for supervisor approval." },
  { question: "Can I book if my company is not registered?", answer: "Employee bookings are linked to a participating company. If your company has not joined yet, ask your transport coordinator to explore company registration. Creating a company account is for the person responsible for setting up your organisation, rather than individual employees." },
  { question: "Who approves my journey?", answer: "Your company’s authorised supervisor or transport team reviews the request. Submitting a request does not mean a rider has been assigned. Wait for approval and the booking updates before you travel." },
  { question: "Who is the web dashboard for?", answer: "The dashboard gives administrators, supervisors, accountants, and riders access to the tools assigned to their role. Employees can use their company’s WhatsApp booking channel to request transport." },
];

function Brand() {
  return (
    <a href="#home" className={styles.brand} aria-label="Kampere Motari Ltd home">
      <span className={styles.brandMark} aria-hidden="true">k<span>.</span></span>
      <span>kampere<span className={styles.brandSecond}>motari ltd</span></span>
    </a>
  );
}

function JourneyPreview() {
  return (
    <div className={styles.journey} aria-label="Illustration of a company journey, with example locations">
      <div className={styles.journeyTop}><span><i /> A more connected journey</span><span>RW / KIGALI</span></div>
      <svg className={styles.map} viewBox="0 0 560 440" fill="none" aria-hidden="true">
        <defs><pattern id="landing-map-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" stroke="#d8e1ed" strokeWidth=".7" /></pattern></defs>
        <path fill="#edf2f8" d="M0 0h560v440H0z" /><path fill="url(#landing-map-grid)" d="M0 0h560v440H0z" />
        <path d="M-30 340C90 360 100 252 198 283S285 440 424 373 511 251 600 265" stroke="#d9e6de" strokeWidth="63" />
        <g stroke="#fff" strokeWidth="18"><path d="M-20 84L580 270M-10 390L582 76M120-30L267 470M396-30L355 470" /><path d="M-10 220L600 402M-20 25L565 175M233-10L600 353" strokeWidth="10" /></g>
        <g stroke="#cfd9e5" strokeWidth="1"><path d="M-20 74L580 260M-10 380L582 66M110-30L257 470M386-30L345 470" /></g>
        <g fill="#dae3ee"><rect x="46" y="117" width="45" height="28" rx="5" transform="rotate(17 46 117)" /><rect x="254" y="103" width="57" height="34" rx="5" transform="rotate(17 254 103)" /><rect x="405" y="241" width="50" height="28" rx="5" transform="rotate(17 405 241)" /><rect x="279" y="278" width="30" height="43" rx="5" transform="rotate(-28 279 278)" /></g>
        <path d="M157 288L227 250L197 151L363 202L391 188" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path className={styles.route} d="M157 288L227 250L197 151L363 202L391 188" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="157" cy="288" r="15" fill="#2563eb" fillOpacity=".12" /><circle cx="157" cy="288" r="7" fill="white" stroke="#2563eb" strokeWidth="4" />
        <circle className={styles.destinationPulse} cx="391" cy="188" r="24" fill="#2563eb" fillOpacity=".12" /><circle cx="391" cy="188" r="9" fill="#2563eb" stroke="white" strokeWidth="4" />
        <g fill="#64748b" fontSize="10" fontFamily="sans-serif" letterSpacing="2"><text x="60" y="208">KACYIRU</text><text x="387" y="128">KIMIRONKO</text><text x="363" y="352">REMERA</text></g>
      </svg>
      <div className={styles.mapLabel}><span className={styles.mapLabelDot} /> Your next stop, connected.</div>
      <div className={styles.tripCard}>
        <div className={styles.tripHeading}><span>THE EVERYDAY, MADE EASIER</span><span className={styles.exampleBadge}>Example trip</span></div>
        <div className={styles.tripLocations}><div><small>Pickup</small><strong>Kimironko</strong></div><ArrowRight size={20} aria-hidden="true" /><div><small>Destination</small><strong>Kacyiru</strong></div></div>
        <div className={styles.tripProgress}><span><b>1</b> Request</span><i /><span><b>2</b> Approve</span><i /><span><b>3</b> Ride</span></div>
      </div>
      <div className={styles.journeyBottom}><span>People. Places. Possibilities.</span><span>One connected workspace.</span></div>
    </div>
  );
}

export function LandingPage({ email, whatsapp }: { email?: string; whatsapp?: string }) {
  const { hydrated, isAuthenticated, role } = useAppSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const signedIn = hydrated && isAuthenticated;
  const workspaceHref = signedIn
    ? role === "EMPLOYEE"
      ? "#employees"
      : role === "PLATFORM_ADMIN"
        ? "/platform"
        : homeForRole(role)
    : "/login";
  const workspaceLabel = signedIn
    ? role === "EMPLOYEE"
      ? "Employee guide"
      : role === "PLATFORM_ADMIN"
        ? "Super Admin"
        : "My dashboard"
    : "Sign in";
  const bookingHref = whatsapp ? `https://wa.me/${whatsapp}` : undefined;

  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!elements || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach((element) => { element.setAttribute("data-observe", "true"); observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText("From Kimironko to Kacyiru at 3pm");
      setCopied(true);
      setCopyError(false);
    } catch { setCopyError(true); }
  }

  return (
    <div ref={root} className={styles.landing} id="home">
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Main navigation">{navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
          <div className={styles.headerActions}>
            <Link className={styles.signIn} href="/register">Register company<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <Link className={styles.signIn} href={workspaceHref}>{workspaceLabel}<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <button type="button" className={styles.menuButton} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {menuOpen && <nav id="mobile-navigation" className={styles.mobileNav} aria-label="Mobile navigation">{navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}<a href="#employees" onClick={() => setMenuOpen(false)}>For employees</a><Link href="/register" onClick={() => setMenuOpen(false)}>Register company</Link>{signedIn && role === "PLATFORM_ADMIN" ? <Link href="/platform" onClick={() => setMenuOpen(false)}>Super Admin</Link> : null}</nav>}
      </header>

      <main id="main">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.smallDot} /> MADE FOR THE WAY YOUR TEAM MOVES</p>
            <h1 id="hero-title">Good journeys.<br />Better <span>workdays.</span></h1>
            <p className={styles.heroDescription}>Your people have places to be. We bring company transport, trip requests, and fleet operations together, so getting there feels simple.</p>
            <div className={styles.actions}><Link href="/register" className={styles.primaryButton}>Register your company <ArrowUpRight size={18} aria-hidden="true" /></Link><a href="#employees" className={styles.textButton}>How employees book <ArrowRight size={17} aria-hidden="true" /></a></div>
            <div className={styles.heroFootnote}><span>Rooted in Rwanda.</span><span>Built around your people.</span></div>
          </div>
          <JourneyPreview />
        </section>

        <div className={`${styles.container} ${styles.introStrip}`}><p>One journey. <strong>Everyone connected.</strong></p><div><span>Employees</span><i /><span>Supervisors</span><i /><span>Riders</span><i /><span>Finance teams</span></div><a href="#about" aria-label="Discover Kampere Motari"><ArrowDown size={20} /></a></div>

        <section id="about" className={`${styles.container} ${styles.about} ${styles.section}`} data-reveal aria-labelledby="about-title">
          <div><p className={styles.eyebrow}>01 / ABOUT KAMPERE MOTARI</p><h2 id="about-title">Moving people.<br /><span>Keeping work moving.</span></h2></div>
          <div className={styles.aboutCopy}><p>A workday is full of small journeys. Getting to a meeting. Visiting a project. Reaching the people who count on you.</p><p>Kampere Motari connects those journeys with the teams behind them. We bring motorcycle transport and company coordination into one place, from the first request to the final trip record.</p><a href="#partners" className={styles.textButton}>A better way to move, together <ArrowUpRight size={17} aria-hidden="true" /></a></div>
        </section>

        <section id="services" className={styles.servicesSection} aria-labelledby="services-title"><div className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHeading} data-reveal><div><p className={styles.eyebrow}>02 / WHAT WE DO</p><h2 id="services-title">Every part of the journey.<br /><span>Thoughtfully connected.</span></h2></div><p>Practical tools for the people on the road<br className={styles.desktopBreak} /> and the teams keeping things running.</p></div>
          <div className={styles.serviceGrid}>{services.map((service) => <article key={service.number} className={`${styles.serviceCard} ${styles[service.className]}`} data-reveal><div className={styles.serviceTop}><span>{service.tag}</span><span>{service.number}</span></div><div className={styles.serviceArt} aria-hidden="true">{service.className === "transport" ? <div className={styles.routeArt}><span>A</span><i /><span>B</span></div> : service.className === "tracking" ? <div className={styles.trackArt}><span /><span /><span /><b /></div> : <div className={styles.billArt}><i /><i /><i /><span>RWF <b>—</b></span></div>}</div><h3>{service.title}</h3><p>{service.text}</p><a href={service.number === "01" ? "#employees" : workspaceHref} className={styles.serviceLink}>{service.number === "01" ? "See how to book" : "Explore your workspace"}<ArrowUpRight size={17} aria-hidden="true" /></a></article>)}</div>
        </div></section>

        <section id="employees" className={`${styles.container} ${styles.section}`} aria-labelledby="employees-title">
          <div className={styles.employeePanel} data-reveal>
            <div className={styles.employeeCopy}>
              <p className={styles.eyebrow}>03 / FOR EMPLOYEES</p><h2 id="employees-title">Your next work trip<br />starts with a message.</h2>
              <p>Part of a participating company? Request your ride through your company’s WhatsApp booking channel, using your registered phone number.</p>
              <ol className={styles.steps}>
                <li><span>01</span><div><h3>Tell us where you’re going</h3><p>Send your pickup, destination, and preferred time.</p></div></li>
                <li><span>02</span><div><h3>Confirm your request</h3><p>Check the details and submit for supervisor approval.</p></div></li>
                <li><span>03</span><div><h3>Get ready to go</h3><p>Wait for approval and your trip updates before setting off.</p></div></li>
              </ol>
              {bookingHref && <a href={bookingHref} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>Request on WhatsApp <ArrowUpRight size={17} aria-hidden="true" /></a>}
              <p className={styles.employeeNote}>New here? Ask your company’s transport coordinator to register your number and share the booking contact.</p>
            </div>
            <div className={styles.messageDemo}>
              <div className={styles.chatHeader}><span className={styles.chatAvatar}>km.</span><div><strong>Your workday, on the move</strong><span>A simple booking conversation</span></div></div>
              <div className={styles.chatBody}><span className={styles.chatDate}>EXAMPLE CONVERSATION</span><div className={styles.sentMessage}>From Kimironko to Kacyiru at 3pm<small>You</small></div><div className={styles.receivedMessage}>Let’s check your journey.<dl><div><dt>Pickup</dt><dd>Kimironko</dd></div><div><dt>Destination</dt><dd>Kacyiru</dd></div><div><dt>Time</dt><dd>3:00 PM</dd></div></dl><span className={styles.confirmPreview}>Confirm trip details</span></div><div className={styles.chatStatus}><span /> Next: supervisor approval</div></div>
              <div className={styles.copyArea}><button type="button" onClick={() => void copyMessage()} className={styles.copyButton}>{copied ? "Example copied" : "Copy example message"}<ArrowUpRight size={15} aria-hidden="true" /></button><p aria-live="polite">{copyError ? "Select and copy the example above, then edit it for your journey." : copied ? "Edit the places and time before sending to your company’s booking number." : "Use your own places and time when you book."}</p></div>
            </div>
          </div>
        </section>

        <section id="partners" className={`${styles.container} ${styles.partners} ${styles.section}`} aria-labelledby="partners-title">
          <div className={styles.sectionHeading} data-reveal><div><p className={styles.eyebrow}>04 / BETTER TOGETHER</p><h2 id="partners-title">Built for companies.<br /><span>Powered by partnership.</span></h2></div><p>We connect employers, transport teams, and riders around a shared goal: making work journeys easier to organise.</p></div>
          <div className={styles.partnerGrid} data-reveal>
            <article><span>THE COMPANIES WE WORK WITH</span><h3>Teams with places to be.</h3><p>Organisations like banks and media houses enrol employees under Kampere Motari. Register your company, submit documents, and wait for approval.</p><div className={styles.sectorTags}><span>Office teams</span><span>Field operations</span><span>Multi-site organisations</span></div><Link href="/register" className={styles.textButton}>Register your company <ArrowUpRight size={17} aria-hidden="true" /></Link></article>
            <article><span>KAMPERE MOTARI SUPER ADMIN</span><h3>Approve and manage every client.</h3><p>Platform admins validate registration documents, approve companies, and manage each company’s admins from one workspace.</p><div className={styles.sectorTags}><span>Document validation</span><span>Company approval</span><span>Admin management</span></div><Link href={signedIn && role === "PLATFORM_ADMIN" ? "/platform" : "/login"} className={styles.textButton}>{signedIn && role === "PLATFORM_ADMIN" ? "Open Super Admin" : "Sign in as Super Admin"} <ArrowUpRight size={17} aria-hidden="true" /></Link></article>
          </div>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-title"><div className={`${styles.container} ${styles.faqLayout} ${styles.section}`}><div data-reveal><p className={styles.eyebrow}>A LITTLE MORE CLARITY</p><h2 id="faq-title">Before you<br /><span>get going.</span></h2><p>Good journeys start with clear answers.</p></div><div className={styles.faqList} data-reveal>{questions.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></div></section>

        <section id="contact" className={`${styles.container} ${styles.section}`} aria-labelledby="contact-title"><div className={styles.contactPanel} data-reveal>
          <div><p className={styles.eyebrow}>05 / LET’S GET MOVING</p><h2 id="contact-title">A better workday<br />starts along the way.</h2><p>Bring your team’s journeys together with Kampere Motari.</p><div className={styles.actions}><Link href="/register" className={styles.whiteButton}>Get your company started <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href={workspaceHref} className={styles.contactSignIn}>{signedIn ? workspaceLabel : "Already part of the team? Sign in"}<ArrowRight size={17} aria-hidden="true" /></Link></div></div>
          <div className={styles.contactDetails}><span>GET IN TOUCH</span><a href="tel:+250782027429">+250 782 027 429 <ArrowUpRight size={17} aria-hidden="true" /></a>{email && <a href={`mailto:${email}`}>{email}<ArrowUpRight size={15} aria-hidden="true" /></a>}<p>For partnerships, company transport, or help getting started, give us a call.</p><a href="#employees">Employee booking guide <ArrowUpRight size={15} aria-hidden="true" /></a><small>KAMPERE MOTARI LTD</small></div>
        </div></section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}><div><Brand /><p>Good journeys. Better workdays.</p></div><nav aria-label="Footer navigation"><a href="#about">About us</a><a href="#services">Services</a><a href="#employees">For employees</a><a href="#contact">Contact</a></nav><div className={styles.footerBottom}><span>© {new Date().getFullYear()} KAMPERE MOTARI LTD</span><span>Made for the way Rwanda moves.</span><a href="#home">Back to top ↑</a></div></footer>
    </div>
  );
}
