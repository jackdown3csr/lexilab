class SoundManager {
  private bgMusic: HTMLAudioElement | null = null
  private bgMusicTracks: string[] = ["/bgmusic1.mp3", "/bgmusic2.mp3", "/bgmusic3.mp3"]
  private isMusicMuted = false
  private isEffectsMuted = false
  private isInitialized = false
  private autoplayAllowed = false
  private musicVolume = 0.05 // 10% default volume for background music
  private effectsVolume = 0.4 // 50% default volume for sound effects

  async initialize() {
    if (this.isInitialized) return

    this.selectRandomBackgroundMusic()
    console.log("Sound initialization complete")

    this.isInitialized = true
  }

  private selectRandomBackgroundMusic() {
    const randomIndex = Math.floor(Math.random() * this.bgMusicTracks.length)
    const selectedTrack = this.bgMusicTracks[randomIndex]
    this.bgMusic = new Audio(selectedTrack)
    this.bgMusic.loop = true
    this.bgMusic.volume = this.musicVolume
    console.log(`Selected background music: ${selectedTrack}`)
  }

  setAutoplayAllowed(allowed: boolean) {
    this.autoplayAllowed = allowed
    if (allowed && !this.isMusicMuted) {
      this.playBackgroundMusic()
    }
  }

  playBackgroundMusic() {
    if (this.bgMusic && !this.isMusicMuted && this.autoplayAllowed) {
      this.bgMusic.play()
    }
  }

  pauseBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
    }
  }

  async changeBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
    }
    this.selectRandomBackgroundMusic()
    if (!this.isMusicMuted && this.autoplayAllowed) {
      this.playBackgroundMusic()
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = volume
    if (this.bgMusic) {
      this.bgMusic.volume = volume
    }
  }

  setEffectsVolume(volume: number) {
    this.effectsVolume = volume
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted
    if (this.bgMusic) {
      if (this.isMusicMuted) {
        this.bgMusic.pause()
      } else {
        this.bgMusic.play()
      }
    }
  }

  toggleEffectsMute() {
    this.isEffectsMuted = !this.isEffectsMuted
  }

  getMusicMuted(): boolean {
    return this.isMusicMuted
  }

  getEffectsMuted(): boolean {
    return this.isEffectsMuted
  }

  isReady(): boolean {
    return this.isInitialized
  }

  getMusicVolume(): number {
    return this.musicVolume
  }

  getEffectsVolume(): number {
    return this.effectsVolume
  }

  generateTone(frequency: number, duration: number, volume: number, type: OscillatorType = "sine") {
    if (typeof window === "undefined" || this.isEffectsMuted) return
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    gainNode.gain.setValueAtTime(volume * this.effectsVolume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  }

  playCorrectLetterSound() {
    this.generateTone(880, 0.1, 0.2, "sine")
  }

  playIncorrectLetterSound() {
    this.generateTone(220, 0.1, 0.2, "sine")
  }

  playButtonClickSound() {
    this.generateTone(440, 0.05, 0.1, "square")
  }

  playWordCompletedSound() {
    this.generateTone(660, 0.1, 0.2, "sine")
    setTimeout(() => this.generateTone(880, 0.1, 0.2, "sine"), 100)
    setTimeout(() => this.generateTone(1100, 0.1, 0.2, "sine"), 200)
  }

  playGameOverSound() {
    this.generateTone(440, 0.1, 0.2, "sawtooth")
    setTimeout(() => this.generateTone(330, 0.1, 0.2, "sawtooth"), 100)
    setTimeout(() => this.generateTone(220, 0.2, 0.2, "sawtooth"), 200)
  }
}

export const soundManager = new SoundManager()

export async function initializeSounds() {
  await soundManager.initialize()
}

export function setAutoplayAllowed(allowed: boolean) {
  soundManager.setAutoplayAllowed(allowed)
}

export function playBackgroundMusic() {
  soundManager.playBackgroundMusic()
}

export function pauseBackgroundMusic() {
  soundManager.pauseBackgroundMusic()
}

export async function changeBackgroundMusic() {
  await soundManager.changeBackgroundMusic()
}

export function setMusicVolume(volume: number) {
  soundManager.setMusicVolume(volume)
}

export function setEffectsVolume(volume: number) {
  soundManager.setEffectsVolume(volume)
}

export function toggleMusicMute() {
  soundManager.toggleMusicMute()
}

export function toggleEffectsMute() {
  soundManager.toggleEffectsMute()
}

export function getMusicMuted(): boolean {
  return soundManager.getMusicMuted()
}

export function getEffectsMuted(): boolean {
  return soundManager.getEffectsMuted()
}

export function isSoundManagerReady(): boolean {
  return soundManager.isReady()
}

export function playCorrectLetterSound() {
  soundManager.playCorrectLetterSound()
}

export function playIncorrectLetterSound() {
  soundManager.playIncorrectLetterSound()
}

export function playButtonClickSound() {
  soundManager.playButtonClickSound()
}

export function playWordCompletedSound() {
  soundManager.playWordCompletedSound()
}

export function playGameOverSound() {
  soundManager.playGameOverSound()
}

export function getMusicVolume(): number {
  return soundManager.getMusicVolume()
}

export function getEffectsVolume(): number {
  return soundManager.getEffectsVolume()
}

