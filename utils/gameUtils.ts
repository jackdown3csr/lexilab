export async function startGame() {
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
    return {
      ...data,
      initialState: {
        ...data.initialState,
        usedWords: [data.initialState.currentWord.toUpperCase()],
      },
    }
  } catch (error) {
    throw error
  }
}

export async function validateGuess(gameId: string, guesses: string, getNewWord: boolean) {
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
    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function getFinalScore(gameId: string, currentScore: number) {
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
    return data
  } catch (error) {
    throw error
  }
}

