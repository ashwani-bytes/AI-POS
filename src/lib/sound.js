/**
 * Web Audio API Retail Sound Synthesizer
 * Zero external audio files required. Works across all devices (Mobile, iPad, Tablet, PC).
 */
export function playPaymentSuccessSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.01, startTime)
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    // Pleasant double-chime (D5 followed by higher A5)
    playTone(587.33, now, 0.18)
    playTone(880.00, now + 0.12, 0.45)
  } catch (e) {
    console.debug('Audio context not permitted or supported yet:', e)
  }
}
