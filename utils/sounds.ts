class SoundManager {
  private bgMusic: HTMLAudioElement | null = null
  private bgMusicTracks: string[] = ["/bgmusic1.mp3", "/bgmusic2.mp3", "/bgmusic3.mp3"]
  private isMusicMuted = false
  private isEffectsMuted = false
  public isInitialized = false
  private autoplayAllowed = false
  private musicVolume = 0.1 // 10% default volume for background music
  private effectsVolume = 0.5 // 50% default volume for sound effects
  private audioContext: AudioContext | null = null
  private isPlaying = false

  async initialize() {
    if (this.isInitialized) return

    this.selectRandomBackgroundMusic()
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    this.isInitialized = true
  }

  private selectRandomBackgroundMusic() {
    const randomIndex = Math.floor(Math.random() * this.bgMusicTracks.length)
    const selectedTrack = this.bgMusicTracks[randomIndex]
    this.bgMusic = new Audio(selectedTrack)
    this.bgMusic.loop = true
    this.bgMusic.volume = this.musicVolume
  }

  public setAutoplayAllowed(allowed: boolean) {
    this.autoplayAllowed = allowed
    if (allowed && !this.isMusicMuted) {
      this.playBackgroundMusic()
    }
  }

  playBackgroundMusic() {
    if (this.bgMusic && !this.isMusicMuted && this.autoplayAllowed && !this.isPlaying) {
      this.isPlaying = true
      this.bgMusic.volume = this.musicVolume
      this.bgMusic.play().catch((error) => {
        this.isPlaying = false
      })
    }
  }

  pauseBackgroundMusic() {
    if (this.bgMusic && this.isPlaying) {
      this.bgMusic.pause()
      this.isPlaying = false
    }
  }

  stopBackgroundMusic() {
    if (this.bgMusic && this.isPlaying) {
      this.bgMusic.pause()
      this.bgMusic.currentTime = 0
      this.isPlaying = false
    }
  }

  async changeBackgroundMusic() {
    if (this.bgMusic) {
      this.pauseBackgroundMusic()
    }
    this.selectRandomBackgroundMusic()
    if (!this.isMusicMuted && this.autoplayAllowed) {
      await new Promise((resolve) => setTimeout(resolve, 100)) // Add a small delay
      this.playBackgroundMusic()
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = volume
    if (this.bgMusic) {
      this.bgMusic.volume = this.isMusicMuted ? 0 : volume
    }
  }

  setEffectsVolume(volume: number) {
    this.effectsVolume = volume
  }

  toggleMusicMute(muted: boolean) {
    this.isMusicMuted = muted
    if (this.bgMusic) {
      if (this.isMusicMuted) {
        this.pauseBackgroundMusic()
      } else if (this.autoplayAllowed) {
        this.playBackgroundMusic()
      }
    }
  }

  toggleEffectsMute(muted: boolean) {
    this.isEffectsMuted = muted
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

  public isAutoplayAllowed(): boolean {
    return this.autoplayAllowed
  }

  public getBgMusic(): HTMLAudioElement | null {
    return this.bgMusic
  }

  public getIsMusicMuted(): boolean {
    return this.isMusicMuted
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public setIsPlaying(value: boolean): void {
    this.isPlaying = value
  }

  private generateTone(frequency: number, duration: number, volume: number, type: OscillatorType = "sine") {
    if (typeof window === "undefined" || this.isEffectsMuted || !this.audioContext) {
      return
    }
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    gainNode.gain.setValueAtTime(volume * this.effectsVolume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  playCorrectLetterSound() {
    this.generateTone(880, 0.1, 0.2, "sine")
  }

  playIncorrectLetterSound() {
    this.generateTone(220, 0.1, 0.2, "sine")
  }

  playButtonClickSound() {
    this.generateTone(220, 0.1, 0.2, "sine")
    setTimeout(() => this.generateTone(165, 0.1, 0.1, "sine"), 50)
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

  playGetReadyBeep() {
    this.generateTone(440, 0.1, 0.1, "sine")
  }

  playLevelCompletionFanfare() {
    const fanfareDuration = 0.15
    const fanfareVolume = 0.3
    this.generateTone(523.25, fanfareDuration, fanfareVolume, "sine") // C5
    setTimeout(() => this.generateTone(659.25, fanfareDuration, fanfareVolume, "sine"), fanfareDuration * 1000) // E5
    setTimeout(() => this.generateTone(783.99, fanfareDuration, fanfareVolume, "sine"), fanfareDuration * 2000) // G5
    setTimeout(() => this.generateTone(1046.5, fanfareDuration * 2, fanfareVolume, "sine"), fanfareDuration * 3000) // C6
  }

  playGoSound() {
    this.generateTone(880, 0.1, 0.3, "square")
    setTimeout(() => this.generateTone(1320, 0.2, 0.3, "square"), 100)
  }

  playGodModeCorrectLetterSound() {
    this.generateTone(1320, 0.1, 0.2, "sine")
  }

  playGodModeIncorrectLetterSound() {
    this.generateTone(165, 0.1, 0.2, "sawtooth")
  }

  playGodModeEnterSound() {
    this.generateTone(880, 0.1, 0.3, "sine")
    setTimeout(() => this.generateTone(1320, 0.1, 0.3, "sine"), 100)
    setTimeout(() => this.generateTone(1760, 0.1, 0.3, "sine"), 200)
  }

  playGodModeExitSound() {
    this.generateTone(1760, 0.1, 0.3, "sine")
    setTimeout(() => this.generateTone(1320, 0.1, 0.3, "sine"), 100)
    setTimeout(() => this.generateTone(880, 0.1, 0.3, "sine"), 200)
  }

  playBonusLifeSound() {
    this.generateTone(880, 0.1, 0.3, "sine")
    setTimeout(() => this.generateTone(1100, 0.1, 0.3, "sine"), 100)
    setTimeout(() => this.generateTone(1320, 0.2, 0.3, "sine"), 200)
  }
}

export const soundManager = new SoundManager()

export async function initializeSounds() {
  if (!soundManager.isInitialized) {
    await soundManager.initialize()
  } else {
  }
}

export function setAutoplayAllowed(allowed: boolean) {
  soundManager.setAutoplayAllowed(allowed)
  if (allowed && !soundManager.getIsMusicMuted()) {
    playBackgroundMusic()
  }
}

export function playBackgroundMusic() {
  if (
    soundManager.getBgMusic() &&
    !soundManager.getIsMusicMuted() &&
    soundManager.isAutoplayAllowed() &&
    !soundManager.getIsPlaying()
  ) {
    soundManager.setIsPlaying(true)
    soundManager
      .getBgMusic()!
      .play()
      .catch((error) => {
        soundManager.setIsPlaying(false)
      })
  } else {
  }
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

export function toggleMusicMute(muted: boolean) {
  soundManager.toggleMusicMute(muted)
}

export function toggleEffectsMute(muted: boolean) {
  soundManager.toggleEffectsMute(muted)
}

export function getMusicMuted(): boolean {
  const muted = soundManager.getMusicMuted()

  return muted
}

export function getEffectsMuted(): boolean {
  const muted = soundManager.getEffectsMuted()

  return muted
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

export function playGetReadyBeep(): void {
  soundManager.playGetReadyBeep()
}

export function playLevelCompletionFanfare() {
  soundManager.playLevelCompletionFanfare()
}

export function playGoSound(): void {
  soundManager.playGoSound()
}

export function playGodModeCorrectLetterSound() {
  soundManager.playGodModeCorrectLetterSound()
}

export function playGodModeIncorrectLetterSound() {
  soundManager.playGodModeIncorrectLetterSound()
}

export function playGodModeEnterSound() {
  soundManager.playGodModeEnterSound()
}

export function playGodModeExitSound() {
  soundManager.playGodModeExitSound()
}

export function stopBackgroundMusic() {
  soundManager.stopBackgroundMusic()
}

export function playBonusLifeSound() {
  soundManager.playBonusLifeSound()
}

