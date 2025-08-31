"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bot, User, ArrowRight, History, AlertTriangle, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RoadmapView } from "@/components/roadmap-view"
import { ChatHistory } from "@/components/chat-history"

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
  type: "bot" | "user"
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
  initialMessage?: string // Added initialMessage prop for custom chat input
}

export function ConversationalFlow({ scenario, onBack, initialMessage }: ConversationalFlowProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userResponses, setUserResponses] = useState<UserResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [troubleshootingMode, setTroubleshootingMode] = useState(false)

  useEffect(() => {
    if (scenario) {
      const welcomeMessage: ConversationMessage = {
        id: "welcome",
        type: "bot",
        content: `Great! I'll help you with "${scenario.title}". Let me ask you a few questions to create a personalized roadmap for you.`,
        timestamp: new Date(),
      }

      const firstQuestion: ConversationMessage = {
        id: "q1",
        type: "bot",
        content: scenario.questions[0] || "Tell me about your situation.",
        timestamp: new Date(),
      }

      setMessages([welcomeMessage, firstQuestion])
    } else {
      const welcomeMessage: ConversationMessage = {
        id: "welcome",
        type: "bot",
        content:
          "Hi! I'm here to help you navigate NSW government services. I'll analyze your question and provide personalized guidance.",
        timestamp: new Date(),
      }

      const initialMessages = [welcomeMessage]

      if (initialMessage) {
        const userMessage: ConversationMessage = {
          id: "initial-user",
          type: "user",
          content: initialMessage,
          timestamp: new Date(),
        }

        const botResponse: ConversationMessage = {
          id: "initial-response",
          type: "bot",
          content: `I understand you're asking about: "${initialMessage}". Let me help you with this. To provide the most accurate guidance, I'll need to ask you a few questions about your specific situation.`,
          timestamp: new Date(),
        }

        const followUpQuestion: ConversationMessage = {
          id: "followup-q1",
          type: "bot",
          content:
            "Could you provide more details about your current situation or what specific outcome you're looking for?",
          timestamp: new Date(),
        }

        initialMessages.push(userMessage, botResponse, followUpQuestion)
      }

      setMessages(initialMessages)
    }
  }, [scenario, initialMessage])

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return

    const userMessage: ConversationMessage = {
      id: `user-${currentQuestionIndex}`,
      type: "user",
      content: currentAnswer,
      timestamp: new Date(),
    }

    const response: UserResponse = {
      questionIndex: currentQuestionIndex,
      question: scenario?.questions[currentQuestionIndex] || "Custom question",
      answer: currentAnswer,
    }

    setUserResponses((prev) => [...prev, response])
    setMessages((prev) => [...prev, userMessage])

    if (scenario && currentQuestionIndex < scenario.questions.length - 1) {
      const nextQuestion: ConversationMessage = {
        id: `q${currentQuestionIndex + 2}`,
        type: "bot",
        content: scenario.questions[currentQuestionIndex + 1],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, nextQuestion])
      setCurrentQuestionIndex((prev) => prev + 1)
      setCurrentAnswer("")
    } else {
      const completionMessage: ConversationMessage = {
        id: "complete",
        type: "bot",
        content: scenario
          ? "Perfect! I have all the information I need. Let me create your personalized roadmap now."
          : "Thank you for the information! Based on what you've told me, I can now create a personalized action plan to help you with your NSW government service needs.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, completionMessage])
      setIsComplete(true)
      setCurrentAnswer("")
    }
  }

  const handleGenerateRoadmap = () => {
    setShowRoadmap(true)
  }

  const handleBackToChat = () => {
    setShowRoadmap(false)
  }

  const handleShowChatHistory = () => {
    setShowChatHistory(true)
  }

  const handleCloseChatHistory = () => {
    setShowChatHistory(false)
  }

  const handleTroubleshooting = () => {
    setTroubleshootingMode(true)
    const troubleshootMessage: ConversationMessage = {
      id: `troubleshoot-${Date.now()}`,
      type: "bot",
      content: "I'm here to help troubleshoot any issues you're experiencing. What specific problem are you facing?",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, troubleshootMessage])
    setIsComplete(false)
  }

  const handleEditResponse = (responseIndex: number, newAnswer: string) => {
    setUserResponses((prev) =>
      prev.map((response, index) => (index === responseIndex ? { ...response, answer: newAnswer } : response)),
    )

    const updateMessage: ConversationMessage = {
      id: `update-${Date.now()}`,
      type: "bot",
      content: `I've updated your response. This may affect your roadmap. Would you like me to regenerate it?`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, updateMessage])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAnswerSubmit()
    }
  }

  if (showRoadmap) {
    return (
      <RoadmapView
        scenario={scenario}
        userResponses={userResponses}
        onBack={handleBackToChat}
        onBackToScenarios={onBack}
        messages={messages}
        onTroubleshooting={handleTroubleshooting}
      />
    )
  }

  if (showChatHistory) {
    return (
      <ChatHistory
        messages={messages}
        userResponses={userResponses}
        onBack={handleCloseChatHistory}
        onEditResponse={handleEditResponse}
        onTroubleshooting={handleTroubleshooting}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
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
        {!scenario && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Custom Chat</h2>
              <p className="text-sm text-muted-foreground">Personalized assistance for your question</p>
            </div>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          {messages.length > 2 && (
            <Button
              variant="outline"
              onClick={handleShowChatHistory}
              className="flex items-center gap-2 bg-transparent"
            >
              <History className="h-4 w-4" />
              Chat History
            </Button>
          )}
          <Button variant="outline" onClick={handleTroubleshooting} className="flex items-center gap-2 bg-transparent">
            <HelpCircle className="h-4 w-4" />
            Get Help
          </Button>
        </div>
      </div>

      <Card className="min-h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-secondary" />
            ServiceNSW Assistant
            {troubleshootingMode && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Troubleshooting Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`p-2 rounded-full ${
                      message.type === "bot" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {message.type === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      message.type === "bot" ? "bg-card border" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isComplete || troubleshootingMode ? (
            <div className="space-y-3">
              <Label htmlFor="answer">Your response:</Label>
              <div className="flex gap-2">
                <Textarea
                  id="answer"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    troubleshootingMode ? "Describe the issue you're experiencing..." : "Type your answer here..."
                  }
                  className="flex-1 min-h-[60px]"
                />
                <Button onClick={handleAnswerSubmit} disabled={!currentAnswer.trim()} className="self-end">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>

              {troubleshootingMode && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Troubleshooting Mode Active</p>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    I'm here to help resolve any issues. Be as specific as possible about what's not working.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Information Complete
              </Badge>
              <p className="text-muted-foreground">
                I've collected all the information needed to create your personalized roadmap.
              </p>
              <Button onClick={handleGenerateRoadmap} className="w-full">
                Generate My Roadmap
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {scenario && !isComplete && !troubleshootingMode && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>
                {currentQuestionIndex + 1} of {scenario.questions.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / scenario.questions.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
