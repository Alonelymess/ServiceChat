// API URL — override via NEXT_PUBLIC_API_URL in .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

// ── Standard (non-streaming) chat ─────────────────────────────────────────────

export async function sendMessageToApi(
  message: string,
  scenarioId: string | null = null,
  uuid: string
): Promise<string> {
  if (scenarioId) {
    message = `Scenario: ${scenarioId}\nUser: ${message}`
  }

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      skip_zrok_interstitial: "true",
    },
    body: JSON.stringify({ message, user_id: uuid, role: "user" }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.message) throw new Error("Invalid response: 'message' field missing")
  return data.message
}

// ── Streaming chat ─────────────────────────────────────────────────────────────

/**
 * Stream a chat message token-by-token from the backend SSE endpoint.
 * @param onToken  Called with each text chunk as it arrives.
 * @param onDone   Called when the stream is complete.
 */
export async function streamMessageToApi(
  message: string,
  scenarioId: string | null = null,
  uuid: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError?: (err: Error) => void,
): Promise<void> {
  if (scenarioId) {
    message = `Scenario: ${scenarioId}\nUser: ${message}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        skip_zrok_interstitial: "true",
      },
      body: JSON.stringify({ message, user_id: uuid, role: "user" }),
    })
  } catch (err) {
    onError?.(err as Error)
    return
  }

  if (!response.ok || !response.body) {
    onError?.(new Error(`API error: ${response.status}`))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""   // keep the incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const payload = line.slice(6).trim()
        if (payload === "[DONE]") {
          onDone()
          return
        }
        try {
          const parsed = JSON.parse(payload)
          if (parsed.token) onToken(parsed.token)
          if (parsed.error) onError?.(new Error(parsed.error))
        } catch {
          // malformed chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  onDone()
}

// ── Roadmap ────────────────────────────────────────────────────────────────────

export interface RoadmapStep {
  title: string
  description: string
  link?: string
  priority: "high" | "medium" | "low"
  estimatedTime?: string
}

export async function fetchRoadmap(
  uuid: string,
  scenarioId: string
): Promise<RoadmapStep[]> {
  const response = await fetch(`${API_URL}/roadmap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      skip_zrok_interstitial: "true",
    },
    body: JSON.stringify({ user_id: uuid, scenario: scenarioId }),
  })

  if (!response.ok) throw new Error(`Roadmap API error: ${response.status}`)
  const data = await response.json()
  return (data.steps ?? []) as RoadmapStep[]
}
