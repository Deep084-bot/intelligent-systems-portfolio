class AudioEngine {
  constructor() {
    this.audioContext = null
    this.buffers = {}
    this.isInitialized = false
    this.isLoading = false
    this.loadError = null
  }

  /**
   * Initialize audio samples. Must be called AFTER user gesture.
   * Returns object with loaded count for progress tracking.
   */
  async init(onProgress) {
    if (this.isInitialized) return { success: true, loaded: 6, total: 6 }
    if (this.isLoading) return { success: false, error: 'Already loading' }

    this.isLoading = true
    this.loadError = null

    // Create AudioContext only after user gesture (fixes autoplay policy)
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      } catch (error) {
        this.loadError = 'AudioContext not supported'
        this.isLoading = false
        return { success: false, error: this.loadError }
      }
    }

    // Resume if suspended (required by browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        this.loadError = 'Failed to resume AudioContext'
        this.isLoading = false
        return { success: false, error: this.loadError }
      }
    }

    const strings = [
      { note: 'E2', path: '/assets/audio/guitar/e2.mp3' },
      { note: 'A2', path: '/assets/audio/guitar/a2.mp3' },
      { note: 'D3', path: '/assets/audio/guitar/d3.mp3' },
      { note: 'G3', path: '/assets/audio/guitar/g3.mp3' },
      { note: 'B3', path: '/assets/audio/guitar/b3.mp3' },
      { note: 'E4', path: '/assets/audio/guitar/e4.mp3' },
    ]

    let loadedCount = 0
    const totalCount = strings.length

    try {
      // Load all samples in parallel, tracking progress
      const loadPromises = strings.map(async ({ note, path }) => {
        try {
          const response = await fetch(path)

          if (!response.ok) {
            // File not found - create synthesized fallback
            console.warn(`Sample not found: ${path}, using synthesized tone`)
            this.buffers[note] = this.createSynthesizedBuffer(note)
            loadedCount++
            if (onProgress) onProgress(loadedCount, totalCount)
            return
          }

          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
          this.buffers[note] = audioBuffer
          loadedCount++
          if (onProgress) onProgress(loadedCount, totalCount)
        } catch (error) {
          console.warn(`Failed to load ${note}: ${error.message}, using synthesized tone`)
          this.buffers[note] = this.createSynthesizedBuffer(note)
          loadedCount++
          if (onProgress) onProgress(loadedCount, totalCount)
        }
      })

      await Promise.all(loadPromises)

      this.isInitialized = true
      this.isLoading = false
      return { success: true, loaded: loadedCount, total: totalCount }
    } catch (error) {
      this.loadError = error.message
      this.isLoading = false
      return { success: false, error: this.loadError }
    }
  }

  /**
   * Create synthesized guitar-like tone as fallback
   * Enhanced with richer harmonics, improved sustain, and balanced volume
   */
  createSynthesizedBuffer(note) {
    const noteFrequencies = {
      E2: 82.41,
      A2: 110.0,
      D3: 146.83,
      G3: 196.0,
      B3: 246.94,
      E4: 329.63,
    }

    // Per-string volume balancing (lower strings naturally louder)
    const stringBalance = {
      E2: 1.1,
      A2: 1.05,
      D3: 1.0,
      G3: 0.95,
      B3: 0.9,
      E4: 0.85,
    }

    const frequency = noteFrequencies[note]
    const balance = stringBalance[note]
    const duration = 3 // Increased sustain
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate tone with richer harmonics and improved decay
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate

      // Slower decay for better sustain
      const decay = Math.exp(-1.5 * t)

      // Richer harmonic series for acoustic guitar tone
      const fundamental = Math.sin(2 * Math.PI * frequency * t)
      const harmonic2 = 0.5 * Math.sin(2 * Math.PI * frequency * 2 * t)
      const harmonic3 = 0.3 * Math.sin(2 * Math.PI * frequency * 3 * t)
      const harmonic4 = 0.15 * Math.sin(2 * Math.PI * frequency * 4 * t)
      const harmonic5 = 0.1 * Math.sin(2 * Math.PI * frequency * 5 * t)

      // Add slight inharmonicity for realism
      const inharmonic = 0.05 * Math.sin(2 * Math.PI * frequency * 2.1 * t)

      // Mix all harmonics with increased volume (0.3 -> 0.5) and per-string balance
      const mixed = (fundamental + harmonic2 + harmonic3 + harmonic4 + harmonic5 + inharmonic) * decay * 0.5 * balance

      // Soft limiter to prevent clipping
      data[i] = Math.tanh(mixed * 1.2)
    }

    return buffer
  }

  /**
   * Play a string with optional velocity for dynamics.
   * Automatically resumes AudioContext if needed.
   */
  async playString(stringIndex, velocity = 1.0) {
    if (!this.isInitialized || !this.audioContext) return

    // Ensure AudioContext is running (handles edge cases)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    const notes = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
    const note = notes[stringIndex]
    const buffer = this.buffers[note]

    if (!buffer) return

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer

    // Velocity-sensitive gain (0.5 to 1.0 range for dynamics)
    const baseGain = 0.5 + (velocity * 0.5)
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(baseGain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.5)

    // Simple convolver for subtle room ambience (very lightweight)
    const dryGain = this.audioContext.createGain()
    const wetGain = this.audioContext.createGain()
    dryGain.gain.value = 0.85 // Mostly dry
    wetGain.gain.value = 0.15 // Subtle wet signal

    // Create impulse response for room ambience
    const convolver = this.audioContext.createConvolver()
    convolver.buffer = this.getReverbBuffer()

    // Routing: source -> gainNode -> [dry path, wet path -> convolver] -> destination
    source.connect(gainNode)
    gainNode.connect(dryGain)
    gainNode.connect(wetGain)
    wetGain.connect(convolver)
    dryGain.connect(this.audioContext.destination)
    convolver.connect(this.audioContext.destination)

    source.start(0)
  }

  /**
   * Create lightweight reverb impulse response (cached)
   */
  getReverbBuffer() {
    if (this.reverbBuffer) return this.reverbBuffer

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * 0.5 // 500ms reverb
    const buffer = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponentially decaying noise for simple room reverb
        const decay = Math.exp(-3 * i / length)
        data[i] = (Math.random() * 2 - 1) * decay * 0.3
      }
    }

    this.reverbBuffer = buffer
    return buffer
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      error: this.loadError,
      contextState: this.audioContext?.state,
    }
  }
}

export default AudioEngine
