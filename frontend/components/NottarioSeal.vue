<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    xmlns="http://www.w3.org/2000/svg"
    :class="['nottario-seal', { 'nottario-seal--animate': animate }]"
    role="img"
    aria-label="Nottario seal"
  >
    <defs>
      <path
        :id="`topArc-${uid}`"
        :d="`M ${cx - r * 0.68} ${cy} A ${r * 0.68} ${r * 0.68} 0 0 1 ${cx + r * 0.68} ${cy}`"
        fill="none"
      />
      <path
        :id="`botArc-${uid}`"
        :d="`M ${cx - r * 0.65} ${cy} A ${r * 0.65} ${r * 0.65} 0 0 0 ${cx + r * 0.65} ${cy}`"
        fill="none"
      />
    </defs>

    <!-- Outer disc -->
    <circle :cx="cx" :cy="cy" :r="r" fill="#1a3a5c"/>

    <!-- Groove rings -->
    <circle :cx="cx" :cy="cy" :r="r * 0.93" fill="none" stroke="#f0f5fb" stroke-width="0.4" opacity="0.4"/>
    <circle :cx="cx" :cy="cy" :r="r * 0.79" fill="none" stroke="#f0f5fb" stroke-width="0.4" opacity="0.4"/>

    <!-- Curved top text -->
    <text font-family="Georgia, serif" :font-size="r * 0.135" font-weight="bold" fill="#f0f5fb" letter-spacing="2">
      <textPath :href="`#topArc-${uid}`" startOffset="50%" text-anchor="middle">N O T T A R I O</textPath>
    </text>

    <!-- Curved bottom text -->
    <text font-family="Georgia, serif" :font-size="r * 0.088" fill="#f0f5fb" opacity="0.8" letter-spacing="1.5">
      <textPath :href="`#botArc-${uid}`" startOffset="50%" text-anchor="middle">DOCUMENT NOTARISATION</textPath>
    </text>

    <!-- Stars -->
    <text :x="cx" :y="cy - r * 0.56" text-anchor="middle" font-size="6" fill="#a8c4e0">✦</text>
    <text :x="cx" :y="cy + r * 0.63" text-anchor="middle" font-size="6" fill="#a8c4e0">✦</text>

    <!-- Document icon -->
    <rect
      :x="cx - r * 0.2"  :y="cy - r * 0.29"
      :width="r * 0.4"   :height="r * 0.48"
      :rx="r * 0.04"
      fill="none" stroke="#a8c4e0" stroke-width="0.8"
    />
    <polyline
      :points="`${cx - r * 0.2},${cy - r * 0.29} ${cx - r * 0.07},${cy - r * 0.29} ${cx - r * 0.07},${cy - r * 0.16} ${cx - r * 0.2},${cy - r * 0.16}`"
      fill="none" stroke="#a8c4e0" stroke-width="0.8"
    />

    <!-- N letter -->
    <text
      :x="cx" :y="cy + r * 0.1"
      text-anchor="middle" dominant-baseline="central"
      font-family="Georgia, serif"
      :font-size="r * 0.34"
      font-weight="bold"
      fill="#f0f5fb"
    >N</text>

    <!-- Green check badge -->
    <circle :cx="cx + r * 0.22" :cy="cy + r * 0.28" :r="r * 0.16" fill="#1a7a4a"/>
    <polyline
      :points="`
        ${cx + r*0.22 - r*0.08},${cy + r*0.28}
        ${cx + r*0.22 - r*0.01},${cy + r*0.28 + r*0.06}
        ${cx + r*0.22 + r*0.1},${cy + r*0.28 - r*0.07}
      `"
      fill="none" stroke="white" :stroke-width="r * 0.055"
      stroke-linecap="round" stroke-linejoin="round"
    />

    <!-- Tick marks -->
    <g stroke="#f0f5fb" stroke-width="0.5" opacity="0.3">
      <line v-for="angle in [0,45,90,135,180,225,270,315]" :key="angle"
        :x1="cx + Math.cos(angle * Math.PI/180) * r * 0.82"
        :y1="cy + Math.sin(angle * Math.PI/180) * r * 0.82"
        :x2="cx + Math.cos(angle * Math.PI/180) * r * 0.93"
        :y2="cy + Math.sin(angle * Math.PI/180) * r * 0.93"
      />
    </g>
  </svg>
</template>

<script setup>
const props = defineProps({
  size:    { type: Number, default: 48 },
  animate: { type: Boolean, default: false },
})

const cx  = computed(() => props.size / 2)
const cy  = computed(() => props.size / 2)
const r   = computed(() => props.size * 0.46)
const uid = useId()
</script>

<style scoped>
.nottario-seal { display: block; flex-shrink: 0; }
.nottario-seal--animate {
  animation: seal-pulse 2.4s ease-in-out infinite;
}
@keyframes seal-pulse {
  0%, 100% { opacity: 1;    transform: scale(1);    }
  50%       { opacity: 0.85; transform: scale(0.97); }
}
</style>
