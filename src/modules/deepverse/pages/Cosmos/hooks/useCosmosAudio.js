import { useRef, useCallback } from 'react'

export function useCosmosAudio() {
  const ctxRef = useRef(null)
  const nodesRef = useRef([])

  const init = useCallback(() => {
    if (ctxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx

    const master = ctx.createGain()
    master.gain.value = 0.1
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    filter.Q.value = 1
    filter.connect(master)

    const layers = [
      { freq: 55, type: 'sine', gain: 0 },
      { freq: 65.41, type: 'sine', gain: 0 },
      { freq: 77.78, type: 'sine', gain: 0 },
      { freq: 130.81, type: 'sine', gain: 0 },
      { freq: 55, type: 'triangle', gain: 0 },
      { freq: 220, type: 'sine', gain: 0 },
    ]

    const drones = layers.map((layer) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = layer.type
      osc.frequency.value = layer.freq
      gain.gain.value = 0
      osc.connect(gain)
      gain.connect(filter)
      osc.start()
      return { osc, gain, freq: layer.freq, type: layer.type }
    })

    nodesRef.current = { drones, filter, master, ctx }
  }, [])

  const update = useCallback((progress) => {
    const { drones, filter, ctx } = nodesRef.current
    if (!drones || !ctx) return

    const t = ctx.currentTime

    drones[0].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.06 * (1 - Math.abs(progress - 0.05) * 3)), t + 0.1
    )
    drones[1].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.05 * (1 - Math.abs(progress - 0.25) * 2.5)), t + 0.1
    )
    drones[2].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.04 * (1 - Math.abs(progress - 0.45) * 2.5)), t + 0.1
    )
    drones[3].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.03 * (1 - Math.abs(progress - 0.65) * 2.5)), t + 0.1
    )
    drones[4].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.02 * (1 - Math.abs(progress - 0.85) * 3)), t + 0.1
    )
    drones[5].gain.gain.linearRampToValueAtTime(
      Math.max(0, 0.01 * Math.max(0, progress - 0.7) * 3), t + 0.1
    )

    const filterFreq = 80 + progress * 400
    filter.frequency.linearRampToValueAtTime(filterFreq, t + 0.2)

    const masterGain = 0.04 + progress * 0.06
    const master = nodesRef.current.master
    if (master) master.gain.linearRampToValueAtTime(masterGain, t + 0.1)
  }, [])

  const stop = useCallback(() => {
    const { drones, ctx } = nodesRef.current
    if (drones) {
      drones.forEach((d) => d.osc.stop())
    }
    nodesRef.current = []
    if (ctx) {
      ctx.close()
      ctxRef.current = null
    }
  }, [])

  return { init, update, stop }
}
