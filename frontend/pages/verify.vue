<template>
  <div class="verify-page">

    <div class="page-bg" aria-hidden="true">
      <div class="bg-rule" v-for="n in 12" :key="n" :style="`top:${n*8}%`"/>
    </div>

    <header class="page-header">
      <NuxtLink to="/" class="brand">
        <NottarioSeal :size="36" />
        <span class="brand-name">Nottario</span>
      </NuxtLink>
      <NuxtLink to="/notarise" class="header-link">Notarise a document →</NuxtLink>
    </header>

    <main class="page-main">

      <!-- IDLE -->
      <Transition name="fade-up" appear>
        <section v-if="step === 'idle'" class="intro-section" key="idle">
          <div class="section-eyebrow">Verification</div>
          <h1 class="section-title">Verify a notarised<br>document.</h1>
          <p class="section-sub">
            Drop the original document and enter the transaction ID from your receipt.
            The fingerprint is recomputed in your browser and checked against our
            records — no upload required.
          </p>

          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">Document</label>
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
                <input ref="fileInput" type="file" class="sr-only" @change="onFileChange"/>
                <Transition name="fade" mode="out-in">
                  <div v-if="!selectedFile" class="drop-zone__empty" key="empty">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <rect x="6" y="2" width="20" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M6 8h20M11 13h10M11 17h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      <path d="M19 2v6h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="drop-zone__label">Drop document or click to browse</span>
                  </div>
                  <div v-else class="drop-zone__file" key="file">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="2" width="16" height="20" rx="2" fill="var(--c-primary-light)" stroke="var(--c-primary)" stroke-width="1.2"/>
                      <path d="M4 6h16M8 10h8M8 13h5" stroke="var(--c-primary)" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                    <div class="file-info">
                      <p class="file-name">{{ selectedFile.name }}</p>
                      <p class="file-size">{{ formatBytes(selectedFile.size) }}</p>
                    </div>
                    <button class="file-remove" @click.stop="selectedFile = null" aria-label="Remove file">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label" for="txid">Transaction ID</label>
              <input
                id="txid"
                v-model="transactionId"
                class="tx-input"
                :class="{ 'tx-input--error': txError }"
                type="text"
                placeholder="NTR-2026-XXXXXXXXXXXXXXXX"
                spellcheck="false"
                autocomplete="off"
                @input="txError = ''"
              />
              <p v-if="txError" class="field-error">{{ txError }}</p>
              <p class="field-hint">Found on your PDF receipt or by scanning the QR code.</p>
            </div>
          </div>

          <div class="privacy-note">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L2 3.5v4c0 2.8 2.1 5.4 5 6 2.9-.6 5-3.2 5-6v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M5 7l1.5 1.5L9 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            The document fingerprint is computed locally. Your file is never uploaded.
          </div>

          <button
            class="cta-btn"
            :disabled="!selectedFile || !transactionId.trim()"
            @click="handleVerify"
          >
            Verify document
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </section>
      </Transition>

      <!-- CHECKING -->
      <Transition name="fade-up">
        <section v-if="step === 'checking'" class="checking-section" key="checking">
          <div class="checking-seal">
            <NottarioSeal :size="72" :animate="true" />
          </div>
          <h2 class="checking-title">Verifying…</h2>
          <p class="checking-sub">Computing fingerprint and checking against our records.</p>
          <div class="checking-steps">
            <div
              v-for="(s, i) in checkingSteps"
              :key="i"
              class="checking-step"
              :class="{ 'checking-step--done': s.done, 'checking-step--active': s.active }"
            >
              <div class="checking-step__dot"/>
              <span>{{ s.label }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- VERIFIED -->
      <Transition name="fade-up">
        <section v-if="step === 'verified' && verifyResult" class="result-section" key="verified">
          <div class="result-badge result-badge--verified">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6.5 11l3 3 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Verified
          </div>
          <h2 class="result-title">Document is authentic.</h2>
          <p class="result-sub">
            This document matches the notarisation record exactly.
            It has not been modified since it was notarised.
          </p>
          <div class="result-card">
            <div class="result-card__header">Notarisation record</div>
            <div class="result-row">
              <span class="result-label">Transaction ID</span>
              <span class="result-value result-value--mono">{{ verifyResult.transactionId }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">Notarised at</span>
              <span class="result-value">{{ formatTimestamp(verifyResult.timestamp) }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">Document hash</span>
              <span class="result-value result-value--mono result-value--hash">{{ verifyResult.hash }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">TSA standard</span>
              <span class="result-value">RFC 3161 · DigiCert Timestamp Authority</span>
            </div>
            <div class="result-row">
              <span class="result-label">Hash match</span>
              <span class="result-value result-value--match">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="var(--c-accent)"/>
                  <path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Exact match
              </span>
            </div>
          </div>
          <button class="secondary-btn" @click="reset">Verify another document</button>
        </section>
      </Transition>

      <!-- MISMATCH -->
      <Transition name="fade-up">
        <section v-if="step === 'mismatch'" class="result-section" key="mismatch">
          <div class="result-badge result-badge--mismatch">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 6v6M11 15v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Not verified
          </div>
          <h2 class="result-title">Hash mismatch.</h2>
          <p class="result-sub">
            The transaction ID exists, but this document's fingerprint does not match
            the stored record. The document may have been modified after notarisation.
          </p>
          <div class="result-card result-card--mismatch">
            <div class="result-card__header">Comparison</div>
            <div class="result-row">
              <span class="result-label">Stored hash</span>
              <span class="result-value result-value--mono result-value--hash">{{ verifyResult?.storedHash }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">Your document</span>
              <span class="result-value result-value--mono result-value--hash result-value--bad">{{ verifyResult?.submittedHash }}</span>
            </div>
          </div>
          <button class="secondary-btn" @click="reset">Try again</button>
        </section>
      </Transition>

      <!-- NOT FOUND -->
      <Transition name="fade-up">
        <section v-if="step === 'not_found'" class="result-section" key="not_found">
          <div class="result-badge result-badge--mismatch">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 7l8 8M15 7l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Not found
          </div>
          <h2 class="result-title">Transaction not found.</h2>
          <p class="result-sub">
            No notarisation record exists for this transaction ID.
            Check the ID from your receipt and try again.
          </p>
          <button class="secondary-btn" @click="reset">Try again</button>
        </section>
      </Transition>

      <!-- ERROR -->
      <Transition name="fade-up">
        <section v-if="step === 'error'" class="result-section" key="error">
          <div class="result-badge result-badge--mismatch">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 6v6M11 15v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Error
          </div>
          <h2 class="result-title">Something went wrong.</h2>
          <p class="result-sub">{{ error }}</p>
          <button class="secondary-btn" @click="reset">Try again</button>
        </section>
      </Transition>

    </main>
  </div>
</template>

<script setup>
const config        = useRuntimeConfig()
const step          = ref('idle')
const error         = ref('')
const verifyResult  = ref(null)
const selectedFile  = ref(null)
const transactionId = ref('')
const txError       = ref('')
const isDragOver    = ref(false)
const fileInput     = ref(null)
const hashingDone   = ref(false)

const route = useRoute()
onMounted(() => {
  const txid = route.query.txid
  if (txid) transactionId.value = txid
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

async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function handleVerify() {
  if (!selectedFile.value || !transactionId.value.trim()) return

  txError.value     = ''
  error.value       = ''
  hashingDone.value = false
  step.value        = 'checking'

  try {
    const hash = await hashFile(selectedFile.value)
    hashingDone.value = true

    const res = await $fetch(config.public.urlVerify, {
      method: 'POST',
      body: { hash, transactionId: transactionId.value.trim() },
    })

    verifyResult.value = {
      transactionId:  res.transactionId,
      timestamp:      res.timestamp,
      hash:           res.storedHash,
      storedHash:     res.storedHash,
      submittedHash:  hash,
    }

    if (!res.found)      step.value = 'not_found'
    else if (res.match)  step.value = 'verified'
    else                 step.value = 'mismatch'

  } catch (e) {
    step.value  = 'error'
    error.value = e?.data?.message ?? e?.message ?? 'Verification failed.'
  }
}

function reset() {
  step.value          = 'idle'
  error.value         = ''
  verifyResult.value  = null
  selectedFile.value  = null
  transactionId.value = ''
  txError.value       = ''
  hashingDone.value   = false
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

const checkingSteps = computed(() => [
  { label: 'Computing document fingerprint locally', done: hashingDone.value,          active: !hashingDone.value },
  { label: 'Looking up transaction record',          done: step.value !== 'checking',  active: hashingDone.value },
])
</script>

<style scoped>
.verify-page {
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
  --c-warn-bg:       #fdf3f3;
  --c-warn-border:   #f0c0bb;
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

.page-header { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid var(--c-border); background: var(--c-bg); }
.brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.brand-name { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--c-primary); letter-spacing: -0.3px; }
.header-link { font-size: 13px; color: var(--c-muted); text-decoration: none; transition: color 0.15s; }
.header-link:hover { color: var(--c-primary); }

.page-main { position: relative; z-index: 10; max-width: 620px; margin: 0 auto; padding: 64px 24px 80px; min-height: calc(100vh - 200px); }

.section-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--c-accent); margin-bottom: 16px; }
.section-title { font-family: var(--font-display); font-size: clamp(30px, 5vw, 44px); font-weight: 600; line-height: 1.15; color: var(--c-primary); margin-bottom: 16px; letter-spacing: -0.5px; }
.section-sub { font-size: 16px; line-height: 1.7; color: var(--c-muted); margin-bottom: 40px; }

.form-grid { display: flex; flex-direction: column; gap: 24px; margin-bottom: 20px; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: var(--c-muted); }

.drop-zone { border: 1.5px dashed var(--c-border); background: var(--c-surface); padding: 28px 24px; cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s; user-select: none; }
.drop-zone:hover, .drop-zone--over { border-color: var(--c-primary); background: var(--c-primary-light); transform: translateY(-1px); }
.drop-zone--has-file { border-style: solid; border-color: var(--c-accent); background: var(--c-accent-light); }
.drop-zone__empty { display: flex; align-items: center; gap: 14px; color: var(--c-muted); }
.drop-zone__label { font-size: 14px; font-weight: 500; color: var(--c-text); }
.drop-zone__file { display: flex; align-items: center; gap: 14px; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.file-size { font-size: 12px; color: var(--c-muted); }
.file-remove { width: 26px; height: 26px; border: 1px solid var(--c-border); background: var(--c-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--c-muted); transition: color 0.15s, border-color 0.15s; flex-shrink: 0; }
.file-remove:hover { color: var(--c-error); border-color: var(--c-error); }

.tx-input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--c-border); background: var(--c-surface); font-family: 'Courier New', monospace; font-size: 14px; color: var(--c-text); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.tx-input:focus { border-color: var(--c-primary); }
.tx-input--error { border-color: var(--c-error); }
.tx-input::placeholder { color: var(--c-muted); font-family: var(--font-body); font-size: 13px; }
.field-error { font-size: 12px; color: var(--c-error); }
.field-hint { font-size: 12px; color: var(--c-muted); }

.privacy-note { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--c-muted); margin-bottom: 32px; }

.cta-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--c-primary); color: #fff; border: none; cursor: pointer; font-family: var(--font-body); font-size: 15px; font-weight: 500; padding: 14px 28px; letter-spacing: 0.3px; transition: background 0.15s, transform 0.15s; }
.cta-btn:hover:not(:disabled) { background: #0f2a45; transform: translateY(-1px); }
.cta-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.checking-section { text-align: center; padding: 48px 0; }
.checking-seal { display: flex; justify-content: center; margin-bottom: 28px; }
.checking-title { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--c-primary); margin-bottom: 10px; }
.checking-sub { font-size: 15px; color: var(--c-muted); max-width: 380px; margin: 0 auto 36px; line-height: 1.6; }
.checking-steps { display: flex; flex-direction: column; gap: 12px; max-width: 340px; margin: 0 auto; text-align: left; }
.checking-step { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--c-muted); transition: color 0.3s; }
.checking-step--done { color: var(--c-accent); }
.checking-step--active { color: var(--c-text); font-weight: 500; }
.checking-step__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-border); flex-shrink: 0; transition: background 0.3s; }
.checking-step--done .checking-step__dot { background: var(--c-accent); }
.checking-step--active .checking-step__dot { background: var(--c-primary); }

.result-section { padding: 8px 0; }
.result-badge { display: inline-flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }
.result-badge--verified { color: var(--c-accent); }
.result-badge--mismatch { color: var(--c-error); }
.result-title { font-family: var(--font-display); font-size: clamp(28px, 4vw, 38px); font-weight: 600; color: var(--c-primary); margin-bottom: 12px; letter-spacing: -0.3px; }
.result-sub { font-size: 15px; line-height: 1.7; color: var(--c-muted); max-width: 500px; margin-bottom: 36px; }

.result-card { border: 1px solid var(--c-border); background: var(--c-surface); margin-bottom: 32px; overflow: hidden; }
.result-card--mismatch { border-color: var(--c-warn-border); background: var(--c-warn-bg); }
.result-card__header { padding: 10px 20px; font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-muted); border-bottom: 1px solid var(--c-border); background: var(--c-bg); }
.result-row { display: flex; padding: 13px 20px; gap: 20px; border-bottom: 1px solid var(--c-border); align-items: baseline; }
.result-row:last-child { border-bottom: none; }
.result-label { font-size: 12px; color: var(--c-muted); min-width: 130px; flex-shrink: 0; }
.result-value { font-size: 14px; color: var(--c-text); font-weight: 500; }
.result-value--mono { font-family: 'Courier New', monospace; font-size: 12px; font-weight: 400; word-break: break-all; }
.result-value--hash { font-size: 11px; line-height: 1.6; word-break: break-all; }
.result-value--bad { color: var(--c-error); }
.result-value--match { display: flex; align-items: center; gap: 6px; color: var(--c-accent); }

.secondary-btn { font-size: 14px; color: var(--c-muted); background: none; border: none; cursor: pointer; text-decoration: underline; font-family: var(--font-body); transition: color 0.15s; }
.secondary-btn:hover { color: var(--c-text); }

.fade-up-enter-active { transition: opacity 0.4s, transform 0.4s; }
.fade-up-enter-from { opacity: 0; transform: translateY(16px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
