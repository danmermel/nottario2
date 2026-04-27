<template>
  <div class="landing">

    <!-- Background -->
    <div class="page-bg" aria-hidden="true">
      <div class="bg-rule" v-for="n in 16" :key="n" :style="`top:${n*6.5}%`"/>
    </div>

    <!-- ── Nav ── -->
    <nav class="nav">
      <div class="nav-brand">
        <NottarioSeal :size="34" />
        <span class="nav-name">Nottario</span>
      </div>
      <div class="nav-links">
        <NuxtLink to="/verify" class="nav-link">Verify</NuxtLink>
        <NuxtLink to="/notarise" class="nav-cta">Notarise a document</NuxtLink>
      </div>
    </nav>

    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero-inner">

        <div class="hero-left">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"/>
            Trusted · Instant · Private
          </div>
          <h1 class="hero-title">
            Legal proof<br>
            your document<br>
            <em>existed.</em>
          </h1>
          <p class="hero-body">
            Nottario timestamps any document with a cryptographic fingerprint
            certified by a trusted third-party authority. No account. No upload.
            Legally valid under RFC&nbsp;3161.
          </p>
          <div class="hero-actions">
            <NuxtLink to="/notarise" class="btn-primary">
              Notarise for £4.99
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </NuxtLink>
            <NuxtLink to="/verify" class="btn-ghost">Verify a document</NuxtLink>
          </div>
          <div class="hero-trust">
            <span v-for="t in trustBadges" :key="t" class="trust-badge">{{ t }}</span>
          </div>
        </div>

        <div class="hero-right" aria-hidden="true">
          <div class="receipt-mockup">
            <div class="mockup-header">
              <NottarioSeal :size="28" />
              <div class="mockup-header-text">
                <span class="mockup-brand">Nottario</span>
                <span class="mockup-sub">Notarisation Receipt</span>
              </div>
            </div>
            <div class="mockup-badge">✓ Document successfully notarised</div>
            <div class="mockup-rows">
              <div class="mockup-row" v-for="r in mockupRows" :key="r.label">
                <span class="mockup-label">{{ r.label }}</span>
                <span class="mockup-value" :class="{ mono: r.mono }">{{ r.value }}</span>
              </div>
            </div>
            <div class="mockup-footer">
              <div class="mockup-qr">
                <div class="qr-inner"/>
              </div>
              <div class="mockup-verify">
                <p class="mockup-verify-label">Scan to verify</p>
                <p class="mockup-verify-url">nottario.com/verify?txid=…</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── How it works ── -->
    <section class="how">
      <div class="section-inner">
        <div class="section-label">How it works</div>
        <h2 class="section-title">Three steps.<br>Under a minute.</h2>
      </div>
      <div class="how-steps">
        <div class="how-step" v-for="(step, i) in steps" :key="i">
          <div class="how-step-num">{{ String(i+1).padStart(2,'0') }}</div>
          <div class="how-step-icon" v-html="step.icon"/>
          <h3 class="how-step-title">{{ step.title }}</h3>
          <p class="how-step-desc">{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ── Privacy section ── -->
    <section class="privacy">
      <div class="privacy-inner">
        <div class="privacy-seal">
          <NottarioSeal :size="72" />
        </div>
        <div class="privacy-content">
          <div class="section-label">Privacy by design</div>
          <h2 class="privacy-title">Your document never<br>leaves your device.</h2>
          <p class="privacy-body">
            Nottario computes the SHA-256 fingerprint of your document directly
            in your browser using the Web Crypto API. Only the 64-character hash
            is ever sent to our servers — never the file itself. We cannot read,
            store, or leak your document because we never receive it.
          </p>
          <ul class="privacy-list">
            <li v-for="item in privacyPoints" :key="item">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#1a7a4a"/>
                <path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ── Use cases ── -->
    <section class="usecases">
      <div class="section-inner">
        <div class="section-label">Use cases</div>
        <h2 class="section-title">Who uses Nottario?</h2>
      </div>
      <div class="usecases-grid">
        <div class="usecase-card" v-for="uc in useCases" :key="uc.title">
          <div class="usecase-icon" v-html="uc.icon"/>
          <h3 class="usecase-title">{{ uc.title }}</h3>
          <p class="usecase-desc">{{ uc.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ── What you receive ── -->
    <section class="receipt-section">
      <div class="section-inner">
        <div class="section-label">What you receive</div>
        <h2 class="section-title">A receipt that stands up.</h2>
        <p class="section-body">
          Every notarisation produces a signed PDF receipt containing everything
          needed for independent verification — by anyone, at any time, forever.
        </p>
      </div>
      <div class="receipt-features">
        <div class="receipt-feature" v-for="f in receiptFeatures" :key="f.title">
          <div class="receipt-feature-bar"/>
          <h4 class="receipt-feature-title">{{ f.title }}</h4>
          <p class="receipt-feature-desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ── CTA banner ── -->
    <section class="cta-banner">
      <div class="cta-banner-inner">
        <NottarioSeal :size="52" />
        <div>
          <h2 class="cta-banner-title">Ready to notarise?</h2>
          <p class="cta-banner-sub">One document. One payment. Instant receipt.</p>
        </div>
        <NuxtLink to="/notarise" class="btn-primary btn-primary--light">
          Get started — £4.99
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <NottarioSeal :size="28" />
          <span class="footer-name">Nottario</span>
        </div>
        <div class="footer-links">
          <NuxtLink to="/notarise" class="footer-link">Notarise</NuxtLink>
          <NuxtLink to="/verify"   class="footer-link">Verify</NuxtLink>
          <a href="mailto:support@nottario.com" class="footer-link">Support</a>
        </div>
        <p class="footer-legal">
          © {{ year }} Nottario Ltd · RFC 3161 compliant timestamps
        </p>
      </div>
    </footer>

  </div>
</template>

<script setup>
const year = new Date().getFullYear()

const trustBadges = ['RFC 3161', 'DigiCert TSA', 'GDPR compliant', 'No account needed']

const mockupRows = [
  { label: 'Transaction',  value: 'NTR-2026-A7F3…B94052',    mono: true  },
  { label: 'Notarised at', value: '20 Mar 2026 · 14:32 UTC',  mono: false },
  { label: 'Hash',         value: 'a3f9b2c1d4e5…e9f0a1',      mono: true  },
  { label: 'Standard',     value: 'RFC 3161 · DigiCert TSA',  mono: false },
]

const steps = [
  {
    title: 'Drop your document',
    desc:  'Any file type. The SHA-256 fingerprint is computed in your browser using the Web Crypto API. Your file never leaves your device.',
    icon:  `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="5" y="2" width="18" height="24" rx="3" stroke="currentColor" stroke-width="1.4"/>
              <path d="M5 7h18M10 12h8M10 16h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M16 2v5h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
  },
  {
    title: 'Pay £4.99',
    desc:  'Secure one-off card payment via Stripe. No subscription, no account. Pay once, receive your receipt immediately.',
    icon:  `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="7" width="22" height="14" rx="3" stroke="currentColor" stroke-width="1.4"/>
              <path d="M3 11h22" stroke="currentColor" stroke-width="1.4"/>
              <rect x="7" y="15" width="6" height="2" rx="1" fill="currentColor"/>
            </svg>`,
  },
  {
    title: 'Download your receipt',
    desc:  'A signed PDF containing your document hash, the RFC 3161 TSA token, a precise UTC timestamp, and a QR code for instant verification.',
    icon:  `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4v14M9 13l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 20v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>`,
  },
]

const privacyPoints = [
  'Document hash computed entirely in-browser',
  'No file upload — ever',
  'We store only the hash, timestamp, and TSA token',
  'No personal data required to notarise',
  'GDPR Article 25 — privacy by design',
]

const useCases = [
  {
    title: 'Freelancers & contractors',
    desc:  'Prove a contract, proposal, or creative brief existed and was agreed at a specific date — before any dispute arises.',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
             <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
             <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.4"/>
             <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
           </svg>`,
  },
  {
    title: 'Legal & compliance teams',
    desc:  'Timestamp evidence, legal drafts, and compliance records for regulatory or litigation purposes.',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
             <path d="M12 1L3 5v6c0 5.25 3.75 10.2 9 11.4C17.25 21.2 21 16.25 21 11V5l-9-4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
           </svg>`,
  },
  {
    title: 'Researchers & academics',
    desc:  'Establish priority of original research, data sets, or unpublished work before submission or publication.',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
             <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
             <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`,
  },
  {
    title: 'Developers & product teams',
    desc:  'Notarise software releases, design specs, or API contracts to create a tamper-evident record of what shipped when.',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
             <polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
             <polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`,
  },
]

const receiptFeatures = [
  { title: 'SHA-256 document hash',    desc: 'A 64-character fingerprint unique to the exact bytes of your document at the moment of notarisation.' },
  { title: 'RFC 3161 TSA token',       desc: 'A signed timestamp token from DigiCert\'s trusted authority, independently verifiable against their public certificate chain.' },
  { title: 'UTC timestamp',            desc: 'Precise date and time of notarisation in Coordinated Universal Time, embedded in the TSA token.' },
  { title: 'QR verification link',     desc: 'Scan to open the verification page with your transaction ID pre-filled. Drop the document — we do the rest.' },
  { title: 'Transaction ID',           desc: 'A unique reference for every notarisation, used to look up the record and verify any future copy of the document.' },
]
</script>

<style scoped>
.landing {
  --c-bg:            #f7f5f0;
  --c-surface:       #ffffff;
  --c-primary:       #1a3a5c;
  --c-primary-light: #e8f0f8;
  --c-accent:        #1a7a4a;
  --c-accent-light:  #eaf5f0;
  --c-text:          #1a1a1a;
  --c-muted:         #6b6b6b;
  --c-border:        #ddd8d0;
  --font-display:    'Playfair Display', Georgia, serif;
  --font-body:       'DM Sans', system-ui, sans-serif;

  background: var(--c-bg);
  font-family: var(--font-body);
  color: var(--c-text);
  position: relative;
  overflow-x: hidden;
}

/* Background */
.page-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.bg-rule { position: absolute; left: 0; right: 0; height: 1px; background: var(--c-border); opacity: 0.35; }

/* ── Nav ──────────────────────────────── */
.nav {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 48px;
  border-bottom: 1px solid var(--c-border);
  background: rgba(247,245,240,0.92);
  backdrop-filter: blur(8px);
}
.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-name { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--c-primary); letter-spacing: -0.3px; }
.nav-links { display: flex; align-items: center; gap: 24px; }
.nav-link { font-size: 14px; color: var(--c-muted); text-decoration: none; transition: color 0.15s; }
.nav-link:hover { color: var(--c-primary); }
.nav-cta { font-size: 14px; font-weight: 500; color: #fff; background: var(--c-primary); padding: 9px 20px; text-decoration: none; transition: background 0.15s; }
.nav-cta:hover { background: #0f2a45; }

/* ── Hero ─────────────────────────────── */
.hero {
  position: relative; z-index: 10;
  min-height: calc(100vh - 64px);
  display: flex; align-items: center;
  border-bottom: 1px solid var(--c-border);
  padding: 80px 48px;
}
.hero-inner {
  max-width: 1100px; margin: 0 auto; width: 100%;
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
}
.hero-eyebrow {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 500; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--c-accent);
  margin-bottom: 24px;
}
.eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--c-accent); flex-shrink: 0;
}
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(44px, 5.5vw, 72px);
  font-weight: 600; line-height: 1.08;
  color: var(--c-primary); letter-spacing: -1px;
  margin-bottom: 24px;
}
.hero-title em { font-style: italic; color: var(--c-accent); }
.hero-body { font-size: 17px; line-height: 1.75; color: var(--c-muted); margin-bottom: 36px; max-width: 440px; }
.hero-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
.hero-trust { display: flex; flex-wrap: wrap; gap: 8px; }
.trust-badge {
  font-size: 11px; font-weight: 500; letter-spacing: 0.8px;
  color: var(--c-muted); border: 1px solid var(--c-border);
  padding: 4px 10px; background: var(--c-surface);
}

/* Receipt mockup */
.hero-right { display: flex; justify-content: center; }
.receipt-mockup {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  width: 100%; max-width: 380px;
  box-shadow: 0 2px 40px rgba(26,58,92,0.08);
}
.mockup-header {
  background: var(--c-primary);
  padding: 16px 20px;
  display: flex; align-items: center; gap: 12px;
}
.mockup-header-text { display: flex; flex-direction: column; }
.mockup-brand { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: #fff; }
.mockup-sub { font-size: 10px; color: rgba(255,255,255,0.6); letter-spacing: 1px; text-transform: uppercase; }
.mockup-badge {
  background: #eaf5f0; color: #1a7a4a;
  font-size: 11px; font-weight: 500;
  padding: 8px 20px; text-align: center;
  border-bottom: 1px solid var(--c-border);
}
.mockup-rows { padding: 4px 0; }
.mockup-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 10px 20px; border-bottom: 1px solid var(--c-border);
  gap: 12px;
}
.mockup-row:last-child { border-bottom: none; }
.mockup-label { font-size: 11px; color: var(--c-muted); flex-shrink: 0; }
.mockup-value { font-size: 11px; color: var(--c-text); font-weight: 500; text-align: right; }
.mockup-value.mono { font-family: 'Courier New', monospace; font-size: 10px; font-weight: 400; }
.mockup-footer {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px; border-top: 1px solid var(--c-border);
  background: var(--c-bg);
}
.mockup-qr { width: 52px; height: 52px; flex-shrink: 0; background: var(--c-surface); border: 1px solid var(--c-border); display: flex; align-items: center; justify-content: center; }
.qr-inner { width: 36px; height: 36px; background: repeating-conic-gradient(var(--c-primary) 0% 25%, transparent 0% 50%) 0 0 / 6px 6px; }
.mockup-verify-label { font-size: 11px; font-weight: 500; color: var(--c-text); margin-bottom: 3px; }
.mockup-verify-url { font-size: 10px; color: var(--c-muted); font-family: 'Courier New', monospace; }

/* ── Buttons ──────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--c-primary); color: #fff;
  font-family: var(--font-body); font-size: 15px; font-weight: 500;
  padding: 14px 28px; text-decoration: none;
  transition: background 0.15s, transform 0.15s;
  letter-spacing: 0.2px;
}
.btn-primary:hover { background: #0f2a45; transform: translateY(-1px); }
.btn-primary--light { background: #fff; color: var(--c-primary); }
.btn-primary--light:hover { background: #f0f5fb; }
.btn-ghost {
  font-size: 14px; color: var(--c-muted);
  text-decoration: underline; text-underline-offset: 3px;
  font-family: var(--font-body); transition: color 0.15s;
}
.btn-ghost:hover { color: var(--c-primary); }

/* ── Shared section ───────────────────── */
.section-inner { max-width: 1100px; margin: 0 auto; padding: 0 48px; }
.section-label {
  font-size: 11px; font-weight: 500; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--c-accent); margin-bottom: 16px;
}
.section-title {
  font-family: var(--font-display); font-size: clamp(32px, 4vw, 52px);
  font-weight: 600; line-height: 1.12; color: var(--c-primary);
  letter-spacing: -0.5px; margin-bottom: 16px;
}
.section-body { font-size: 16px; line-height: 1.7; color: var(--c-muted); max-width: 560px; }

/* ── How it works ─────────────────────── */
.how {
  position: relative; z-index: 10;
  padding: 96px 48px;
  border-bottom: 1px solid var(--c-border);
}
.how-steps {
  max-width: 1100px; margin: 56px auto 0;
  display: grid; grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--c-border); background: var(--c-surface);
}
.how-step {
  padding: 40px 36px;
  border-right: 1px solid var(--c-border);
  position: relative;
}
.how-step:last-child { border-right: none; }
.how-step-num {
  font-family: var(--font-display); font-size: 36px; font-weight: 600;
  color: var(--c-border); line-height: 1; margin-bottom: 20px;
}
.how-step-icon { color: var(--c-primary); margin-bottom: 16px; }
.how-step-title { font-size: 16px; font-weight: 500; color: var(--c-text); margin-bottom: 10px; }
.how-step-desc { font-size: 14px; line-height: 1.65; color: var(--c-muted); }

/* ── Privacy ──────────────────────────── */
.privacy {
  position: relative; z-index: 10;
  padding: 96px 48px;
  background: var(--c-primary);
  border-bottom: 1px solid var(--c-border);
}
.privacy-inner {
  max-width: 1100px; margin: 0 auto;
  display: grid; grid-template-columns: auto 1fr; gap: 80px; align-items: start;
}
.privacy-seal { padding-top: 8px; }
.privacy-title {
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 600; line-height: 1.12;
  color: #fff; letter-spacing: -0.5px; margin-bottom: 20px;
}
.privacy .section-label { color: #a8c4e0; }
.privacy-body { font-size: 16px; line-height: 1.75; color: rgba(255,255,255,0.7); margin-bottom: 28px; }
.privacy-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.privacy-list li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.85); }

/* ── Use cases ────────────────────────── */
.usecases {
  position: relative; z-index: 10;
  padding: 96px 48px;
  border-bottom: 1px solid var(--c-border);
}
.usecases-grid {
  max-width: 1100px; margin: 56px auto 0;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
  background: var(--c-border); border: 1px solid var(--c-border);
}
.usecase-card {
  background: var(--c-surface); padding: 36px;
  transition: background 0.2s;
}
.usecase-card:hover { background: var(--c-primary-light); }
.usecase-icon { color: var(--c-primary); margin-bottom: 16px; }
.usecase-title { font-size: 16px; font-weight: 500; color: var(--c-text); margin-bottom: 10px; }
.usecase-desc { font-size: 14px; line-height: 1.65; color: var(--c-muted); }

/* ── Receipt features ─────────────────── */
.receipt-section {
  position: relative; z-index: 10;
  padding: 96px 48px;
  border-bottom: 1px solid var(--c-border);
}
.receipt-features {
  max-width: 1100px; margin: 56px auto 0;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;
}
.receipt-feature { position: relative; padding-top: 16px; }
.receipt-feature-bar {
  position: absolute; top: 0; left: 0;
  width: 32px; height: 2px; background: var(--c-accent);
}
.receipt-feature-title { font-size: 14px; font-weight: 500; color: var(--c-text); margin-bottom: 8px; }
.receipt-feature-desc { font-size: 13px; line-height: 1.65; color: var(--c-muted); }

/* ── CTA banner ───────────────────────── */
.cta-banner {
  position: relative; z-index: 10;
  padding: 80px 48px;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
}
.cta-banner-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: center; gap: 36px; flex-wrap: wrap;
}
.cta-banner-title {
  font-family: var(--font-display); font-size: 36px;
  font-weight: 600; color: var(--c-primary);
  letter-spacing: -0.3px; margin-bottom: 4px;
}
.cta-banner-sub { font-size: 15px; color: var(--c-muted); }
.cta-banner-inner .btn-primary { margin-left: auto; white-space: nowrap; }

/* ── Footer ───────────────────────────── */
.footer {
  position: relative; z-index: 10;
  padding: 40px 48px;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface);
}
.footer-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
}
.footer-brand { display: flex; align-items: center; gap: 10px; }
.footer-name { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--c-primary); }
.footer-links { display: flex; gap: 24px; margin-left: 16px; }
.footer-link { font-size: 13px; color: var(--c-muted); text-decoration: none; transition: color 0.15s; }
.footer-link:hover { color: var(--c-primary); }
.footer-legal { font-size: 12px; color: var(--c-muted); margin-left: auto; }
</style>
