"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bot, User, ArrowRight, History, HelpCircle, Loader2, Map } from "lucide-react"
import { RoadmapView } from "@/components/roadmap-view"
import { ChatHistory } from "@/components/chat-history"
import { sendMessageToApi, streamMessageToApi } from "@/lib/api"
import Markdown from "react-markdown"
import styles from "@/styles/MarkdownStyles.module.css"
import { v4 as uuidv4 } from "uuid"
import { BirthRegistrationForm } from "@/components/birth-registration-form"
import { ChangeAddressForm } from "@/components/change-address-form"
import { StormDamageForm } from "@/components/storm-damage-form"
import { BusinessRegistrationForm } from "@/components/business-registration-form"
import { NewArrivalForm } from "@/components/new-arrival-form"

interface ServiceScenario {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  estimatedTime: string
  category: "life-event" | "emergency" | "general"
  questions: string[]
}

interface ConversationMessage {
  id: string
  role: "bot" | "user"
  content: string
  timestamp: Date
}

interface UserResponse {
  questionIndex: number
  question: string
  answer: string
}

interface ConversationalFlowProps {
  scenario: ServiceScenario | undefined
  onBack: () => void
  initialMessage?: string
}

function getOrCreateUserId(): string {
  let userId = localStorage.getItem("userId")
  if (!userId) {
    userId = uuidv4()
    localStorage.setItem("userId", userId)
  }
  return userId
}

export function ConversationalChatBot({ scenario, onBack, initialMessage }: ConversationalFlowProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [userResponses, setUserResponses] = useState<UserResponse[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const userId = getOrCreateUserId()

  // "general" is the fallback scenario when the user types freely without picking one
  const scenarioId: string = scenario?.id ?? "general"
  const storageKey = `chatHistory-${userId}-${scenarioId}`

  // ── Routing: scenario-specific form components ──────────────────────────────
  if (scenario?.id === "new-baby") {
    return <BirthRegistrationForm userId={userId} />
  }
  if (scenario?.id === "change-address") {
    return <ChangeAddressForm userId={userId} />
  }
  if (scenario?.id === "storm-damage") {
    return <StormDamageForm userId={userId} />
  }
  if (scenario?.id === "business-registration") {
    return <BusinessRegistrationForm userId={userId} />
  }
  if (scenario?.id === "new-arrival") {
    return <NewArrivalForm userId={userId} />
  }

  // ── Streaming send ──────────────────────────────────────────────────────────
  const sendStreaming = async (text: string) => {
    const thinkingId = `bot-thinking-${Date.now()}`
    const streamingId = `bot-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "bot", content: "...", timestamp: new Date() },
    ])

    let started = false

    await streamMessageToApi(
      text,
      scenarioId,
      userId,
      (token) => {
        if (!started) {
          // Replace the thinking bubble with the streaming message on first token
          started = true
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== thinkingId),
            { id: streamingId, role: "bot", content: token, timestamp: new Date() },
          ])
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, content: m.content + token } : m,
            ),
          )
        }
      },
      () => {
        setIsLoading(false)
      },
      (err) => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== thinkingId && m.id !== streamingId),
          {
            id: `bot-error-${Date.now()}`,
            role: "bot",
            content: "Sorry, I'm having trouble connecting right now. Please try again.",
            timestamp: new Date(),
          },
        ])
        setIsLoading(false)
      },
    )
  }

  // ── Initialise chat ─────────────────────────────────────────────────────────
  useEffect(() => {
    const isFreeChatQuery = !scenario && !!initialMessage?.trim()

    // Restore saved history only for scenario chats, not fresh free-chat queries
    if (!isFreeChatQuery) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
          setMessages(parsed)
        } catch {
          localStorage.removeItem(storageKey)
        }
        return
      }
    }

    if (isFreeChatQuery) {
      // Free-chat: show the user's message as a visible bubble, then get AI response
      const userMsg: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: initialMessage!.trim(),
        timestamp: new Date(),
      }
      setMessages([userMsg])
      setIsLoading(true)
      sendStreaming(initialMessage!.trim())
    } else {
      const greeting = scenario
        ? `I've selected the scenario: "${scenario.title}". Please greet me and ask how you can assist.`
        : "I am a new user. Please greet me and ask how you can help with NSW government services."
      setIsLoading(true)
      sendStreaming(greeting)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // ── Persist messages ────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
  }, [messages, storageKey])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // ── User sends a message ────────────────────────────────────────────────────
  const handleMessageSubmit = async () => {
    if (!currentMessage.trim() || isLoading) return
    const text = currentMessage.trim()
    setCurrentMessage("")
    setIsLoading(true)

    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    await sendStreaming(text)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleMessageSubmit()
    }
  }

  // ── Reset / Refresh ─────────────────────────────────────────────────────────
  const handleRefreshDialog = async () => {
    try {
      await sendMessageToApi(
        `User requested to clean the chat history for this scenario: ${scenarioId}`,
        scenarioId,
        userId,
      )
    } catch {
      // Continue even if the backend call fails
    }
    localStorage.removeItem(storageKey)
    setMessages([])
    setUserResponses([])
    setCurrentMessage("")
    setIsLoading(true)

    const greeting = scenario
      ? `I've selected the scenario: "${scenario.title}". Please greet me and ask how you can assist.`
      : "I am a new user. Please greet me and ask how you can help with NSW government services."
    await sendStreaming(greeting)
  }

  const handleGenerateRoadmap = () => setShowRoadmap(true)
  const handleBackToChat = () => setShowRoadmap(false)
  const handleShowChatHistory = () => setShowChatHistory(true)
  const handleCloseChatHistory = () => setShowChatHistory(false)
  const handleEditResponse = (i: number, answer: string) =>
    setUserResponses((prev) => prev.map((r, idx) => (idx === i ? { ...r, answer } : r)))

  const handleGetHelp = () => {
    window.open("https://www.service.nsw.gov.au/contact-us", "_blank", "noopener,noreferrer")
  }

  // ── Render: roadmap / history views ────────────────────────────────────────
  if (showRoadmap) {
    return (
      <RoadmapView
        scenario={scenario}
        userResponses={userResponses}
        onBack={handleBackToChat}
        onBackToScenarios={onBack}
        messages={messages.map((m) => ({ ...m, type: m.role }))}
        onTroubleshooting={() => {}}
        userId={userId}
        scenarioId={scenarioId}
      />
    )
  }

  if (showChatHistory) {
    return (
      <ChatHistory
        messages={messages.map((m) => ({ ...m, type: m.role }))}
        userResponses={userResponses}
        onBack={handleCloseChatHistory}
        onEditResponse={handleEditResponse}
        onTroubleshooting={() => {}}
      />
    )
  }

  // ── Main chat view ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Scenarios
        </Button>
        {scenario && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">{scenario.icon}</div>
            <div>
              <h2 className="font-semibold text-lg">{scenario.title}</h2>
              <p className="text-sm text-muted-foreground">Estimated time: {scenario.estimatedTime}</p>
            </div>
          </div>
        )}
        <div className="ml-auto flex gap-2 flex-wrap">
          {messages.length > 1 && (
            <Button
              variant="outline"
              onClick={handleShowChatHistory}
              className="flex items-center gap-2 bg-transparent"
            >
              <History className="h-4 w-4" />
              Chat History
            </Button>
          )}
          {messages.length > 2 && (
            <Button
              variant="outline"
              onClick={handleGenerateRoadmap}
              className="flex items-center gap-2 bg-transparent"
            >
              <Map className="h-4 w-4" />
              My Roadmap
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefreshDialog}
            className="flex items-center gap-2 bg-transparent"
            disabled={isLoading}
          >
            <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            New Chat
          </Button>
          <Button
            variant="outline"
            onClick={handleGetHelp}
            className="flex items-center gap-2 bg-transparent"
          >
            <HelpCircle className="h-4 w-4" />
            Get Help
          </Button>
        </div>
      </div>

      {/* Chat card */}
      <Card className="min-h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-secondary" />
            ServiceNSW Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div
            ref={chatContainerRef}
            className="flex-1 space-y-4 mb-6 max-h-[480px] overflow-y-auto p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`p-2 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center ${
                      message.role === "bot"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {message.role === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      message.role === "bot"
                        ? "bg-card border"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.content === "..." ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking…</span>
                      </div>
                    ) : (
                      <div className={styles.markdown}>
                        <Markdown>{message.content}</Markdown>
                      </div>
                    )}
                    {message.content !== "..." && (
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label htmlFor="message">Your message:</Label>
            <div className="flex gap-2">
              <Textarea
                id="message"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here…"
                className="flex-1 min-h-[60px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleMessageSubmit}
                disabled={isLoading || !currentMessage.trim()}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
