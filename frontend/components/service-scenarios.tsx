"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ConversationalFlow } from "@/components/conversational-flow"
import { ConversationalChatBot } from "./conversational_chatbot"

interface ServiceScenario {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: "life-event" | "emergency" | "general"
  questions: string[]
}

const scenarios: ServiceScenario[] = [
  {
    id: "new-arrival",
    title: "I just arrived in Australia",
    description: "Get essential services set up as a new resident",
    /* Updated to NSW material design icon style */
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
    category: "life-event",
    questions: [
      "What type of visa do you have?",
      "Which state/territory are you living in?",
      "Do you have a job offer or employment?",
      "Do you need to transfer an overseas license?",
    ],
  },
  {
    id: "new-baby",
    title: "I just had a baby",
    description: "Register your newborn and access family services",
    /* Updated to NSW material design icon style */
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V4C15 1.79 13.21 0 11 0S7 1.79 7 4V5.5L1 7V9L7 7.5V22H9V16H15V22H17V7.5L21 9Z" />
      </svg>
    ),
    category: "life-event",
    questions: [
      "Where was your baby born?",
      "What is your citizenship status?",
      "What is your partner's citizenship status?",
      "Do you need to apply for child support?",
    ],
  },
  {
    id: "storm-damage",
    title: "A storm damaged my property",
    description: "Report damage and access emergency assistance",
    /* Updated to NSW material design icon style */
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    category: "emergency",
    questions: [
      "What type of damage occurred?",
      "Do you have insurance?",
      "Is your property currently habitable?",
      "Do you need temporary accommodation?",
    ],
  },
  {
    id: "change-address",
    title: "I need to change my address",
    description: "Update your address across all government services",
    /* Updated to NSW material design icon style */
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
    category: "general",
    questions: [
      "What is your new address?",
      "When did you move?",
      "Do you have a driver's license to update?",
      "Are you enrolled to vote?",
    ],
  },
  {
    id: "business-registration",
    title: "I want to start a business",
    description: "Register your business and get required licenses",
    /* Updated to NSW material design icon style */
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    ),
    category: "general",
    questions: [
      "What type of business are you starting?",
      "Will you have employees?",
      "Do you need specific licenses or permits?",
      "What business structure do you prefer?",
    ],
  },
]

/* Updated category colors to match blue theme */
const categoryColors = {
  "life-event": "bg-primary/10 text-primary border-primary/20",
  emergency: "bg-red-50 text-red-700 border-red-200",
  general: "bg-secondary/10 text-secondary border-secondary/20",
}

export function ServiceScenarios() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [conversationStarted, setConversationStarted] = useState(false)
  const [chatInput, setChatInput] = useState("")

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId)
    setConversationStarted(true)
  }

  const handleCustomChatStart = (initialMessage?: string) => {
    setSelectedScenario("custom")
    setConversationStarted(true)
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatInput.trim()) {
      handleCustomChatStart(chatInput)
    }
  }

  const handleBackToScenarios = () => {
    setSelectedScenario(null)
    setConversationStarted(false)
    setChatInput("")
  }

  if (conversationStarted && selectedScenario) {
    const scenario = scenarios.find((s) => s.id === selectedScenario)
    // return <ConversationalFlow scenario={scenario} onBack={handleBackToScenarios} initialMessage={chatInput} />
    return <ConversationalChatBot scenario={scenario} onBack={handleBackToScenarios} initialMessage={chatInput} />
  }

  return (
    <div className="space-y-8">
      {/* Chat Bar Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <form onSubmit={handleChatSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              <h3 className="font-semibold text-primary">Ask me anything about NSW services</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type your question here... (e.g., How do I renew my driver's license?)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 border-primary/30 focus:border-primary"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scenario Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Or choose a common scenario:</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary hover:bg-primary group"
              onClick={() => handleScenarioSelect(scenario.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-white/20 group-hover:text-white transition-colors">
                      {scenario.icon}
                    </div>
                    <Badge variant="outline" className={categoryColors[scenario.category]}>
                      {scenario.category.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg text-balance group-hover:text-white transition-colors">
                  {scenario.title}
                </CardTitle>
                <CardDescription className="text-pretty group-hover:text-white/90 transition-colors">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
