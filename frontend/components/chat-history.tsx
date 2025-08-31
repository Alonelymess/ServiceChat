"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, User, Edit3, Save, X, AlertTriangle, CheckCircle2 } from "lucide-react"

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

interface ChatHistoryProps {
  messages: ConversationMessage[]
  userResponses: UserResponse[]
  onBack: () => void
  onEditResponse: (responseIndex: number, newAnswer: string) => void
  onTroubleshooting: () => void
}

export function ChatHistory({ messages, userResponses, onBack, onEditResponse, onTroubleshooting }: ChatHistoryProps) {
  const [editingResponse, setEditingResponse] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleStartEdit = (responseIndex: number, currentAnswer: string) => {
    setEditingResponse(responseIndex)
    setEditValue(currentAnswer)
  }

  const handleSaveEdit = () => {
    if (editingResponse !== null && editValue.trim()) {
      onEditResponse(editingResponse, editValue.trim())
      setEditingResponse(null)
      setEditValue("")
    }
  }

  const handleCancelEdit = () => {
    setEditingResponse(null)
    setEditValue("")
  }

  const filteredMessages = messages.filter((message) =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getResponseForMessage = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return null

    // Find the corresponding user response
    const userMessage = messages[messageIndex + 1]
    if (userMessage?.type === "user") {
      const responseIndex = userResponses.findIndex((r) => r.answer === userMessage.content)
      return responseIndex !== -1 ? { response: userResponses[responseIndex], index: responseIndex } : null
    }
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Chat History & Troubleshooting</h2>
              <p className="text-sm text-muted-foreground">Review and edit your responses</p>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={onTroubleshooting} className="flex items-center gap-2 bg-transparent">
          <AlertTriangle className="h-4 w-4" />
          Report Issue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat History */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="search">Search messages</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversation..."
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredMessages.map((message, index) => {
                  const responseData = message.type === "bot" ? getResponseForMessage(message.id) : null

                  return (
                    <div key={message.id} className="space-y-2">
                      {/* Bot/User Message */}
                      <div className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
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

                      {/* Editable User Response */}
                      {responseData && (
                        <div className="ml-8">
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      Your Response
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Question {responseData.response.questionIndex + 1}
                                    </span>
                                  </div>

                                  {editingResponse === responseData.index ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveEdit}>
                                          <Save className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          className="bg-transparent"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-sm">{responseData.response.answer}</p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleStartEdit(responseData.index, responseData.response.answer)
                                        }
                                        className="bg-transparent"
                                      >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        Edit Response
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Troubleshooting Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={onTroubleshooting} className="w-full justify-start bg-transparent">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
              <Button variant="outline" onClick={onBack} className="w-full justify-start bg-transparent">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Continue Process
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Form Declined?</h4>
                <p className="text-xs text-muted-foreground">
                  Check your responses above and edit any incorrect information. Common issues include wrong dates,
                  missing documents, or incorrect visa details.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Application Rejected?</h4>
                <p className="text-xs text-muted-foreground">
                  Review the rejection notice and identify which information needs to be corrected. Use the edit
                  function to update your responses.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Need More Help?</h4>
                <p className="text-xs text-muted-foreground">
                  Click "Report an Issue" to get personalized troubleshooting assistance from our AI assistant.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Responses:</span>
                  <span className="font-medium">{userResponses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">{messages[0]?.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
