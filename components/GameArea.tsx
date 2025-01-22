import { useState, useEffect } from "react"
import { Star, Heart, Zap, Clock, Shield } from "lucide-react"
import styles from "@/styles/GameArea.module.css"

interface GameAreaProps {
  currentWord: string
  currentHint: string
  score: number
  correctKeys: Set<string>
  timeBonus: number
  multiplier: number
  showAnimation: boolean
  totalAttempts: number
  level: number
  isTimeBonusActive: boolean
  isGetReadyPhase: boolean
  showGetReadyAnimation: boolean
  setShowGetReadyAnimation: (value: boolean) => void
  showGameOverAnimation: boolean
}

export default function GameArea({
  currentWord,
  currentHint,
  score,
  correctKeys,
  timeBonus,
  multiplier,
  showAnimation,
  totalAttempts,
  level,
  isTimeBonusActive,
  isGetReadyPhase,
  showGetReadyAnimation,
  setShowGetReadyAnimation,
  showGameOverAnimation,
}: GameAreaProps) {
  const [displayMultiplier, setDisplayMultiplier] = useState(multiplier)
  const [animatedScore, setAnimatedScore] = useState(score)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMultiplier((prev) => {
        const diff = multiplier - prev
        if (Math.abs(diff) < 0.1) return multiplier
        return prev + diff * 0.1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [multiplier])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedScore((prev) => {
        const diff = score - prev
        if (Math.abs(diff) < 1) return score
        return prev + Math.sign(diff) * Math.ceil(Math.abs(diff) * 0.1)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [score])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showGetReadyAnimation) {
      timer = setTimeout(() => {
        setShowGetReadyAnimation(false)
      }, 2000)
    }
    return () => clearTimeout(timer)
  }, [showGetReadyAnimation, setShowGetReadyAnimation])

  const renderLetter = (letter: string, index: number) => {
    const isNonAlphabetic = !/^[A-Z]$/i.test(letter)
    const isRevealed = correctKeys.has(letter) || isNonAlphabetic

    return (
      <span
        key={index}
        className={`${styles.letter} ${isRevealed ? styles.revealed : ""} ${isNonAlphabetic ? styles.nonAlphabetic : ""}`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {isRevealed ? letter : "_"}
      </span>
    )
  }

  const renderMultiplierStars = () => {
    const starCount = Math.floor(displayMultiplier || 0)
    const fractionalPart = (displayMultiplier || 0) - starCount
    const stars = []

    for (let i = 0; i < 5; i++) {
      if (i < starCount) {
        stars.push(<Star key={i} className={`${styles.multiplierStar} ${styles.active}`} />)
      } else if (i === starCount && fractionalPart > 0) {
        stars.push(
          <Star
            key={i}
            className={`${styles.multiplierStar} ${styles.active}`}
            style={{ clipPath: `inset(0 ${100 - fractionalPart * 100}% 0 0)` }}
          />,
        )
      } else {
        stars.push(<Star key={i} className={styles.multiplierStar} />)
      }
    }

    return stars
  }

  return (
    <div className={styles.gameArea}>
      <div className={styles.scoreInfoGrid}>
        <div className={styles.scoreItem}>
          <Star className={styles.scoreIcon} />
          <span className={styles.label}>SCORE</span>
          <span className={styles.value}>{Math.round(animatedScore)}</span>
        </div>
        <div className={styles.scoreItem}>
          <Heart className={styles.scoreIcon} />
          <span className={styles.label}>LIVES</span>
          <span className={styles.value}>{totalAttempts}</span>
        </div>
        <div className={styles.scoreItem}>
          <Shield className={styles.scoreIcon} />
          <span className={styles.label}>LEVEL</span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.scoreItem}>
          <Zap className={styles.scoreIcon} />
          <span className={styles.label}>MULTIPLIER</span>
          <div className={styles.multiplierStars}>{renderMultiplierStars()}</div>
        </div>
      </div>
      <div className={styles.timeBonusContainer}>
        <div
          className={styles.timeBonusBar}
          style={{
            width: `${isTimeBonusActive ? timeBonus || 0 : 100}%`,
            transition: isTimeBonusActive ? "width 0.2s linear" : "none",
          }}
        ></div>
        <Clock className={styles.timeBonusIcon} />
        <span className={styles.timeBonusText}>{isTimeBonusActive ? `TIME BONUS: ${Math.round(timeBonus)}` : ""}</span>
      </div>
      <div className={styles.gameContent}>
        <div className={styles.wordContainer}>{currentWord.split("").map(renderLetter)}</div>
        <div className={styles.hint}>{currentHint.toUpperCase()}</div>
      </div>
      {showAnimation && (
        <div className={styles.wordCompletionAnimation}>
          <span>WELL DONE!</span>
        </div>
      )}
      {(showGetReadyAnimation || isGetReadyPhase) && (
        <div className={`${styles.getReadyAnimation} ${isGetReadyPhase ? styles.fadeOut : ""}`}>
          <span>GET READY!</span>
        </div>
      )}
      {showGameOverAnimation && (
        <div className={styles.gameOverAnimation}>
          <span>GAME OVER!</span>
        </div>
      )}
    </div>
  )
}

