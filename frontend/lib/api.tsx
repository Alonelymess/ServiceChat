// Ensure this URL points to your /chat endpoint
const API_URL = "https://i9awsgqvaro3.share.zrok.io/chat"

/**
 * Sends the conversation history to the chatbot API and returns the bot's response.
 * @param messages - An array of conversation messages.
 * @returns A promise that resolves to the bot's response string.
 * @throws Will throw an error if the API request fails.
 */
export async function sendMessageToApi(
  message: string,
  scenarioId: string | null = null,
  uuid: string
): Promise<{ nextQuestion: any; previewForm: any }> {
  try {
    if (scenarioId) {
      message = `Scenario: ${scenarioId}\nUser: ${message}`
    }
    console.log("[v0] Sending message:", message)

    const requestBody = {
      message: message,
      user_id: uuid, // Example user_id
      role: "user",
    }

    console.log("[v0] Request body:", requestBody)

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        skip_zrok_interstitial: "true", // <-- ADD THIS LINE
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`API error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    console.log("[v0] Response data:", responseData)
    // Return the full response object (with nextQuestion, previewForm, etc)
    if (!responseData.message) {
      throw new Error("Invalid response from API: 'message' field is missing")
    }

    return responseData.message
  } catch (error) {
    console.error("Failed to communicate with the API:", error)
    throw error
  }
}
