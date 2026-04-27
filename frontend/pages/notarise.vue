<template>
  <div class="notarise-page">

    <div class="page-bg" aria-hidden="true">
      <div class="bg-rule" v-for="n in 12" :key="n" :style="`top:${n*8}%`"/>
    </div>

    <header class="page-header">
      <div class="brand">
        <NottarioSeal :size="36" />
        <span class="brand-name">Nottario</span>
      </div>
    </header>

    <main class="page-main">

      <!-- IDLE / UPLOAD -->
      <Transition name="fade-up" appear>
        <section v-if="step === 'idle'" class="upload-section" key="upload">
          <div class="section-eyebrow">Document notarisation</div>
          <h1 class="section-title">
            Prove your document<br>existed — right now.
          </h1>
          <p class="section-sub">
            Your document never leaves your device. We compute a cryptographic
            fingerprint locally, timestamp it with a trusted authority, and
            issue you a legally valid receipt.
          </p>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--over': isDragOver, 'drop-zone--has-file': selectedFile }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
            role="button"
            tabindex="0"
            @keydown.enter="fileInput?.click()"
            aria-label="Drop your document here or click to browse"
          >
            <input
              ref="fileInput"
              type="file"
              class="sr-only"
              @change="onFileChange"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            />
            <Transition name="fade" mode="out-in">
              <div v-if="!selectedFile" class="drop-zone__empty" key="empty">
                <div class="drop-zone__icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="8" y="4" width="24" height="30" rx="3" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 10h24M14 16h12M14 21h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M24 4v7h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="28" cy="28" r="7" fill="var(--c-bg)" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M28 25v6M25 28h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="drop-zone__label">Drop your document here</p>
                <p class="drop-zone__hint">or click to browse — PDF, DOCX, TXT, images</p>
              </div>
              <div v-else class="drop-zone__file" key="file">
                <div class="file-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="2" width="20" height="28" rx="3" fill="var(--c-primary-light)" stroke="var(--c-primary)" stroke-width="1.5"/>
                    <path d="M6 8h20M11 13h10M11 17h7" stroke="var(--c-primary)" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M19 2v6h7" stroke="var(--c-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="file-info">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ formatBytes(selectedFile.size) }}</p>
                </div>
                <button class="file-remove" @click.stop="selectedFile = null" aria-label="Remove file">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </Transition>
          </div>

          <div class="privacy-note">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L2 3.5v4c0 2.8 2.1 5.4 5 6 2.9-.6 5-3.2 5-6v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M5 7l1.5 1.5L9 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Your document is hashed locally and <strong>never uploaded</strong> to our servers.
          </div>

          <div class="cta-row">
            <div class="price-tag">
              <span class="price-amount">£4.99</span>
              <span class="price-label">per notarisation</span>
            </div>
            <v-btn
              class="cta-btn"
              :disabled="!selectedFile"
              @click="handleNotarise"
              size="large"
              rounded="0"
              elevation="0"
            >
              Notarise document
              <svg class="btn-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </v-btn>
          </div>
        </section>
      </Transition>

      <!-- PROGRESS -->
      <Transition name="fade-up">
        <section v-if="['hashing','checkout','waiting_payment','notarising'].includes(step)" class="progress-section" key="progress">
          <div class="progress-seal">
            <NottarioSeal :size="64" :animate="true" />
          </div>
          <h2 class="progress-title">{{ progressTitle }}</h2>
          <p class="progress-sub">{{ progressSub }}</p>
          <div class="progress-track">
            <div class="progress-fill" :style="`width:${progressPct}%`"/>
          </div>
          <div class="progress-steps">
            <div
              v-for="(s, i) in progressSteps"
              :key="i"
              class="progress-step"
              :class="{ 'progress-step--done': s.done, 'progress-step--active': s.active }"
            >
              <div class="progress-step__dot"/>
              <span>{{ s.label }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- DONE -->
      <Transition name="fade-up">
        <section v-if="step === 'done' && result" class="done-section" key="done">
          <div class="done-badge">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="var(--c-accent)" stroke-width="1.5"/>
              <path d="M9 16l5 5 9-9" stroke="var(--c-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Document notarised
          </div>
          <h2 class="done-title">Your receipt is ready.</h2>
          <div class="receipt-card">
            <div class="receipt-row">
              <span class="receipt-label">Transaction ID</span>
              <span class="receipt-value receipt-value--mono">{{ result.transactionId }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Timestamp</span>
              <span class="receipt-value">{{ formatTimestamp(result.timestamp) }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Document hash</span>
              <span class="receipt-value receipt-value--mono receipt-value--truncate">{{ result.hash }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Standard</span>
              <span class="receipt-value">RFC 3161 · DigiCert TSA</span>
            </div>
          </div>
          <div class="done-actions">
            <v-btn
              class="cta-btn"
              :href="result.receiptUrl"
              target="_blank"
              size="large"
              rounded="0"
              elevation="0"
            >
              Download PDF receipt
              <svg class="btn-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v9M5 8l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 14h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </v-btn>
            <button class="secondary-btn" @click="reset">Notarise another document</button>
          </div>
          <p class="done-warning">
            Save your PDF receipt — it is the only record of this notarisation.
          </p>
        </section>
      </Transition>

      <!-- ERROR -->
      <Transition name="fade-up">
        <section v-if="step === 'error'" class="error-section" key="error">
          <div class="error-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="var(--c-error)" stroke-width="1.5"/>
              <path d="M16 9v8M16 21v2" stroke="var(--c-error)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="error-title">Something went wrong.</h2>
          <p class="error-message">{{ error }}</p>
          <button class="secondary-btn" @click="reset">Try again</button>
        </section>
      </Transition>

    </main>

    <aside class="how-it-works" v-if="step === 'idle'">
      <div class="how-step" v-for="(s, i) in howSteps" :key="i">
        <span class="how-num">{{ String(i+1).padStart(2,'0') }}</span>
        <div>
          <p class="how-label">{{ s.label }}</p>
          <p class="how-desc">{{ s.desc }}</p>
        </div>
      </div>
    </aside>

  </div>
</template>

<script setup>
const { step, error, result, notarise, completeAfterPayment, reset } = useNotarise()
const route = useRoute()

const isDragOver   = ref(false)
const selectedFile = ref(null)
const fileInput    = ref(null)

onMounted(async () => {
  const sessionId = route.query.session_id
  if (sessionId) {
    await completeAfterPayment(sessionId)
    await navigateTo({ path: '/notarise' }, { replace: true })
  }
})

function onDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) selectedFile.value = file
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) selectedFile.value = file
}

async function handleNotarise() {
  if (!selectedFile.value) return
  await notarise(selectedFile.value)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

const progressSteps = computed(() => [
  { label: 'Hashing document locally',       done: step.value !== 'hashing',                             active: step.value === 'hashing' },
  { label: 'Redirecting to payment',         done: ['notarising','done'].includes(step.value),            active: ['checkout','waiting_payment'].includes(step.value) },
  { label: 'Timestamping with DigiCert TSA', done: step.value === 'done',                                 active: step.value === 'notarising' },
])

const progressPct = computed(() => {
  const map = { hashing: 20, checkout: 40, waiting_payment: 55, notarising: 80, done: 100 }
  return map[step.value] ?? 0
})

const progressTitle = computed(() => {
  const map = {
    hashing:         'Computing fingerprint…',
    checkout:        'Preparing payment…',
    waiting_payment: 'Waiting for payment…',
    notarising:      'Timestamping document…',
  }
  return map[step.value] ?? ''
})

const progressSub = computed(() => {
  const map = {
    hashing:         'SHA-256 is being computed in your browser. Your file never leaves your device.',
    checkout:        'Opening Stripe Checkout. Your payment is handled securely by Stripe.',
    waiting_payment: 'Complete payment in the Stripe window.',
    notarising:      'Sending your document fingerprint to DigiCert\'s trusted timestamp authority.',
  }
  return map[step.value] ?? ''
})

const howSteps = [
  { label: 'Drop your document', desc: 'Any file type. It never leaves your browser.' },
  { label: 'Pay £4.99',          desc: 'Secure card payment via Stripe. No account needed.' },
  { label: 'Receive your receipt', desc: 'A PDF with your hash, timestamp, and TSA token.' },
]
</script>

<style scoped>
.notarise-page {
  --c-bg:            #f7f5f0;
  --c-surface:       #ffffff;
  --c-primary:       #1a3a5c;
  --c-primary-light: #e8f0f8;
  --c-accent:        #1a7a4a;
  --c-accent-light:  #eaf5f0;
  --c-text:          #1a1a1a;
  --c-muted:         #6b6b6b;
  --c-border:        #ddd8d0;
  --c-error:         #c0392b;
  --font-display:    'Playfair Display', Georgia, serif;
  --font-body:       'DM Sans', system-ui, sans-serif;

  min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-body);
  color: var(--c-text);
  position: relative;
  overflow-x: hidden;
}

.page-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.bg-rule { position: absolute; left: 0; right: 0; height: 1px; background: var(--c-border); opacity: 0.4; }

.page-header {
  position: relative; z-index: 10;
  display: flex; align-items: center;
  padding: 20px 40px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg);
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-name { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--c-primary); letter-spacing: -0.3px; }

.page-main { position: relative; z-index: 10; max-width: 620px; margin: 0 auto; padding: 64px 24px 80px; min-height: calc(100vh - 200px); }

.section-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--c-accent); margin-bottom: 16px; }
.section-title { font-family: var(--font-display); font-size: clamp(32px, 5vw, 46px); font-weight: 600; line-height: 1.15; color: var(--c-primary); margin-bottom: 16px; letter-spacing: -0.5px; }
.section-sub { font-size: 16px; line-height: 1.7; color: var(--c-muted); margin-bottom: 40px; max-width: 500px; }

.drop-zone { border: 1.5px dashed var(--c-border); background: var(--c-surface); padding: 48px 32px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s; margin-bottom: 16px; user-select: none; }
.drop-zone:hover, .drop-zone--over { border-color: var(--c-primary); background: var(--c-primary-light); transform: translateY(-2px); }
.drop-zone--has-file { border-style: solid; border-color: var(--c-accent); background: var(--c-accent-light); }
.drop-zone__icon { color: var(--c-muted); margin-bottom: 16px; display: flex; justify-content: center; }
.drop-zone__label { font-size: 16px; font-weight: 500; color: var(--c-text); margin-bottom: 6px; }
.drop-zone__hint { font-size: 13px; color: var(--c-muted); }
.drop-zone__file { display: flex; align-items: center; gap: 16px; text-align: left; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 15px; font-weight: 500; color: var(--c-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.file-size { font-size: 12px; color: var(--c-muted); }
.file-remove { flex-shrink: 0; width: 28px; height: 28px; border: 1px solid var(--c-border); background: var(--c-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--c-muted); transition: color 0.15s, border-color 0.15s; }
.file-remove:hover { color: var(--c-error); border-color: var(--c-error); }

.privacy-note { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--c-muted); margin-bottom: 36px; }
.privacy-note strong { color: var(--c-text); }

.cta-row { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.price-tag { display: flex; flex-direction: column; line-height: 1.2; }
.price-amount { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--c-primary); }
.price-label { font-size: 12px; color: var(--c-muted); }
.cta-btn { background: var(--c-primary) !important; color: #fff !important; font-family: var(--font-body) !important; font-size: 15px !important; font-weight: 500 !important; letter-spacing: 0.3px !important; padding: 0 28px !important; height: 52px !important; display: flex !important; align-items: center !important; gap: 10px !important; transition: background 0.15s, transform 0.15s !important; }
.cta-btn:hover:not(:disabled) { background: #0f2a45 !important; transform: translateY(-1px); }
.cta-btn:disabled { opacity: 0.4 !important; }

.progress-section { text-align: center; padding: 40px 0; }
.progress-seal { display: flex; justify-content: center; margin-bottom: 32px; }
.progress-title { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--c-primary); margin-bottom: 10px; }
.progress-sub { font-size: 15px; color: var(--c-muted); max-width: 420px; margin: 0 auto 36px; line-height: 1.6; }
.progress-track { height: 3px; background: var(--c-border); margin-bottom: 32px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--c-accent); transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
.progress-steps { display: flex; flex-direction: column; gap: 12px; text-align: left; max-width: 360px; margin: 0 auto; }
.progress-step { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--c-muted); transition: color 0.3s; }
.progress-step--done { color: var(--c-accent); }
.progress-step--active { color: var(--c-text); font-weight: 500; }
.progress-step__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-border); flex-shrink: 0; transition: background 0.3s; }
.progress-step--done .progress-step__dot { background: var(--c-accent); }
.progress-step--active .progress-step__dot { background: var(--c-primary); }

.done-section { padding: 20px 0; }
.done-badge { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: var(--c-accent); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }
.done-title { font-family: var(--font-display); font-size: 36px; font-weight: 600; color: var(--c-primary); margin-bottom: 32px; letter-spacing: -0.3px; }
.receipt-card { border: 1px solid var(--c-border); background: var(--c-surface); margin-bottom: 32px; }
.receipt-row { display: flex; padding: 14px 20px; gap: 20px; border-bottom: 1px solid var(--c-border); align-items: baseline; }
.receipt-row:last-child { border-bottom: none; }
.receipt-label { font-size: 12px; color: var(--c-muted); min-width: 130px; flex-shrink: 0; }
.receipt-value { font-size: 14px; color: var(--c-text); font-weight: 500; }
.receipt-value--mono { font-family: 'Courier New', monospace; font-size: 12.5px; font-weight: 400; word-break: break-all; }
.receipt-value--truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; }
.done-actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
.secondary-btn { font-size: 14px; color: var(--c-muted); background: none; border: none; cursor: pointer; text-decoration: underline; font-family: var(--font-body); transition: color 0.15s; }
.secondary-btn:hover { color: var(--c-text); }
.done-warning { font-size: 12.5px; color: var(--c-muted); }

.error-section { text-align: center; padding: 48px 0; }
.error-icon { display: flex; justify-content: center; margin-bottom: 20px; }
.error-title { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--c-primary); margin-bottom: 10px; }
.error-message { font-size: 15px; color: var(--c-error); margin-bottom: 28px; }

.how-it-works { position: relative; z-index: 10; border-top: 1px solid var(--c-border); display: flex; justify-content: center; background: var(--c-surface); }
.how-step { flex: 1; max-width: 240px; padding: 32px 28px; display: flex; gap: 16px; border-right: 1px solid var(--c-border); }
.how-step:last-child { border-right: none; }
.how-num { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--c-border); flex-shrink: 0; line-height: 1; margin-top: 2px; }
.how-label { font-size: 14px; font-weight: 500; color: var(--c-text); margin-bottom: 4px; }
.how-desc { font-size: 12.5px; color: var(--c-muted); line-height: 1.5; }

.fade-up-enter-active { transition: opacity 0.4s, transform 0.4s; }
.fade-up-enter-from { opacity: 0; transform: translateY(16px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
