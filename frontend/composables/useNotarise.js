export function useNotarise() {
  const config = useRuntimeConfig()

  const step      = ref('idle')
  const error     = ref(null)
  const result    = ref(null)
  const fileName  = ref('')
  const fileSize  = ref(0)

  async function hashFile(file) {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async function notarise(file) {
    error.value  = null
    result.value = null
    fileName.value = file.name
    fileSize.value = file.size

    try {
      // 1 — hash locally, document never leaves device
      step.value = 'hashing'
      const hash = await hashFile(file)

      // 2 — create Stripe Checkout session
      step.value = 'checkout'
      const checkoutRes = await $fetch(config.public.urlCheckout, {
        method: 'POST',
        body: { hash, fileName: file.name },
      })

      // 3 — redirect to Stripe, return via ?session_id=
      step.value = 'waiting_payment'
      window.location.href = checkoutRes.url

    } catch (e) {
      step.value  = 'error'
      error.value = e?.data?.message ?? e?.message ?? 'Something went wrong.'
    }
  }

  // Called on return from Stripe with ?session_id=xxx
  async function completeAfterPayment(sessionId) {
    error.value = null
    step.value  = 'notarising'

    try {
      const res = await $fetch(config.public.urlNotarise, {
        method: 'POST',
        body: { sessionId },
      })
      result.value = res
      step.value   = 'done'
    } catch (e) {
      step.value  = 'error'
      error.value = e?.data?.message ?? e?.message ?? 'Notarisation failed.'
    }
  }

  function reset() {
    step.value     = 'idle'
    error.value    = null
    result.value   = null
    fileName.value = ''
    fileSize.value = 0
  }

  return {
    step:     readonly(step),
    error:    readonly(error),
    result:   readonly(result),
    fileName: readonly(fileName),
    fileSize: readonly(fileSize),
    notarise,
    completeAfterPayment,
    reset,
  }
}
