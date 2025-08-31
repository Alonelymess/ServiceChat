"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bot, User, ArrowRight, History, HelpCircle, Loader2 } from "lucide-react"
import { RoadmapView } from "@/components/roadmap-view"
import { ChatHistory } from "@/components/chat-history"
import { sendMessageToApi } from "@/lib/api" // Assuming your API function is in lib/api.ts
import Markdown from 'react-markdown';
import styles from '@/styles/MarkdownStyles.module.css'
import { v4 as uuidv4 } from 'uuid'
import { BirthRegistrationForm } from "@/components/birth-registration-form"

// Define the structure of your data and props
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
}

// Get or create a unique user ID
function getOrCreateUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('userId', userId);
  }
  return userId;
}

export function ConversationalChatBot({ scenario, onBack }: ConversationalFlowProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [userResponses, setUserResponses] = useState<UserResponse[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const userId = getOrCreateUserId();

  // Unique key for localStorage per user and scenario
  const scenarioKey = scenario ? `chatHistory-${userId}-${scenario.id}` : `chatHistory-${userId}-custom`;

  // Load chat history from localStorage when scenario changes
  useEffect(() => {
    const saved = localStorage.getItem(scenarioKey);
    if (saved) {
      // Parse and revive Date objects
      const parsed = JSON.parse(saved).map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      setMessages(parsed);
      setIsLoading(false);
      return;
    }
    // Effect to initialize the chat by fetching the first message from the API
    const initializeChat = async () => {
      setIsLoading(true);

      const initialPrompt = {
        role: "user" as const,
        content: scenario
          ? `I've selected the scenario: "${scenario.title}". Please greet me and ask how you can assist with this.`
          : "I am a new user. Please greet me and ask how you can help with NSW government services.",
      };

      const connectingMessage: ConversationMessage = {
        id: `bot-connecting-${Date.now()}`,
        role: "bot",
        content: "...", // This will be rendered as a loading spinner
        timestamp: new Date(),
      };
      setMessages([connectingMessage]);

      try {
        const firstBotMessageContent = await sendMessageToApi(initialPrompt.content, scenario ? scenario.id : null, userId);

        const firstBotMessage: ConversationMessage = {
          id: "welcome",
          role: "bot",
          content: firstBotMessageContent,
          timestamp: new Date(),
        };
        setMessages([firstBotMessage]);

      } catch (error) {
        const errorMessage: ConversationMessage = {
          id: "init-error",
          role: "bot",
          content: "Sorry, I couldn't connect to the assistant right now. Please try again later.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [scenarioKey]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(scenarioKey, JSON.stringify(messages));
    }
  }, [messages, scenarioKey]);

  // Effect to auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Handles submitting a new message from the user
  const handleMessageSubmit = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setCurrentMessage("")
    setIsLoading(true)

    // Add a temporary "thinking" message
    const thinkingMessageId = `bot-thinking-${Date.now()}`
    const thinkingMessage: ConversationMessage = {
      id: thinkingMessageId,
      role: "bot",
      content: "...",
      timestamp: new Date(),
    }
    setMessages([...newMessages, thinkingMessage])

    try {
      const botContent = await sendMessageToApi(userMessage.content, scenario ? scenario.id : null, userId);
      
      const botResponse: ConversationMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: botContent,
        timestamp: new Date(),
      }
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== thinkingMessageId).concat(botResponse))
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: `bot-error-${Date.now()}`,
        role: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      }
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== thinkingMessageId).concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  // Allows submitting the message with the Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleMessageSubmit()
    }
  }

  // Add this handler to clear chat history, notify API, and reset dialog state (no reload)
  const handleRefreshDialog = async () => {
    try {
      await sendMessageToApi('User requested to clean the chat history for this scenario: ' + (scenario ? scenario.title : 'custom scenario'), scenario ? scenario.id : null, userId);
    } catch (e) {
      // Optionally handle error, but still proceed
    }
    localStorage.removeItem(scenarioKey);
    setMessages([]);
    setUserResponses([]);
    setCurrentMessage("");
    setIsLoading(false);
    // Re-run the initialization logic
    const initialPrompt = {
      role: "user" as const,
      content: scenario
        ? `I've selected the scenario: "${scenario.title}". Please greet me and ask how you can assist with this.`
        : "I am a new user. Please greet me and ask how you can help with NSW government services.",
    };
    const connectingMessage: ConversationMessage = {
      id: `bot-connecting-${Date.now()}`,
      role: "bot",
      content: "...",
      timestamp: new Date(),
    };
    setMessages([connectingMessage]);
    setIsLoading(true);
    try {
      const firstBotMessageContent = await sendMessageToApi(initialPrompt.content, scenario ? scenario.id : null, userId);
      const firstBotMessage: ConversationMessage = {
        id: "welcome",
        role: "bot",
        content: firstBotMessageContent,
        timestamp: new Date(),
      };
      setMessages([firstBotMessage]);
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: "init-error",
        role: "bot",
        content: "Sorry, I couldn't connect to the assistant right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Other UI-related handlers ---
  const handleGenerateRoadmap = () => setShowRoadmap(true)
  const handleBackToChat = () => setShowRoadmap(false)
  const handleShowChatHistory = () => setShowChatHistory(true)
  const handleCloseChatHistory = () => setShowChatHistory(false)
  const handleEditResponse = (responseIndex: number, newAnswer: string) => {
    setUserResponses((prev) =>
      prev.map((response, index) => (index === responseIndex ? { ...response, answer: newAnswer } : response)),
    )
  }

  // --- Conditional Rendering for different views ---
  if (showRoadmap) {
    return (
      <RoadmapView
        scenario={scenario}
        userResponses={userResponses}
        onBack={handleBackToChat}
        onBackToScenarios={onBack}
        messages={messages.map((m) => ({ ...m, type: m.role }))}
        onTroubleshooting={() => {}}
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

  if (scenario && scenario.id === "new-baby") {
    const userId = getOrCreateUserId ? getOrCreateUserId() : "";
    return <BirthRegistrationForm userId={userId} />;
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
        <div className="ml-auto flex gap-2">
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
          <Button variant="outline" onClick={handleRefreshDialog} className="flex items-center gap-2 bg-transparent">
            <Loader2 className="h-4 w-4" />
            Refresh Dialog
          </Button>
          <Button variant="outline" onClick={() => {}} className="flex items-center gap-2 bg-transparent">
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
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div ref={chatContainerRef} className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`p-2 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center ${
                      message.role === "bot" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {message.role === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      message.role === "bot" ? "bg-card border" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.id.includes("bot-thinking") || message.id.includes("bot-connecting") ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <div className={styles.markdown}>
                        <Markdown>{message.content}</Markdown>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
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
                onChange={(e) => 
                  {
                    console.log("onChange fired. New value:", e.target.value);
                    setCurrentMessage(e.target.value)
                  }
                }
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 min-h-[60px]"
                disabled={isLoading}
              />
              <Button onClick={handleMessageSubmit} disabled={isLoading || !currentMessage.trim()} className="self-end">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
