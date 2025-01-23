export async function startGame() {
  console.log("Starting new game")
  try {
    const response = await fetch("/api/start-game", {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (!data || !data.gameId || !data.initialState) {
      throw new Error("Invalid response from server")
    }
    console.log("Game started successfully", data)
    return {
      ...data,
      initialState: {
        ...data.initialState,
        usedWords: [data.initialState.currentWord.toUpperCase()],
      },
    }
  } catch (error) {
    console.error("Error in startGame:", error)
    throw error
  }
}

export async function validateGuess(gameId: string, guesses: string, getNewWord: boolean) {
  console.log("Validating guess", { gameId, guesses, getNewWord })
  try {
    const response = await fetch("/api/validate-guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId, guesses, getNewWord }),
    })
    if (!response.ok) {
      throw new Error("Failed to validate guess")
    }
    const data = await response.json()
    console.log("Guess validation result:", data)
    return data
  } catch (error) {
    console.error("Error in validateGuess:", error)
    throw error
  }
}

export async function getFinalScore(gameId: string, currentScore: number) {
  console.log("Getting final score", { gameId, currentScore })
  try {
    const response = await fetch(`/api/get-final-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId, currentScore }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (data.finalScore === undefined) {
      throw new Error("Final score not found in response")
    }
    console.log("Final score retrieved:", data)
    return data
  } catch (error) {
    console.error("Error in getFinalScore:", error)
    throw error
  }
}

