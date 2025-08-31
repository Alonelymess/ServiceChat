"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Clock,
  MapPin,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  Navigation,
  History,
  HelpCircle,
} from "lucide-react"
import { FormAssistance } from "@/components/form-assistance"
import { LocationFinder } from "@/components/location-finder"
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

interface UserResponse {
  questionIndex: number
  question: string
  answer: string
}

interface ConversationMessage {
  id: string
  type: "bot" | "user"
  content: string
  timestamp: Date
}

interface RoadmapStep {
  id: string
  title: string
  description: string
  type: "online" | "offline"
  estimatedTime: string
  priority: "high" | "medium" | "low"
  dependencies?: string[]
  location?: string
  formRequired?: boolean
  formImage?: string
  instructions: string[]
  completed: boolean
}

interface RoadmapViewProps {
  scenario: ServiceScenario | undefined
  userResponses: UserResponse[]
  onBack: () => void
  onBackToScenarios: () => void
  messages?: ConversationMessage[]
  onTroubleshooting?: () => void
}

const generateRoadmap = (scenario: ServiceScenario | undefined, responses: UserResponse[]): RoadmapStep[] => {
  if (!scenario) return []

  const baseSteps: Record<string, RoadmapStep[]> = {
    "new-arrival": [
      {
        id: "tfn",
        title: "Apply for Tax File Number (TFN)",
        description: "Essential for working and banking in Australia",
        type: "online",
        estimatedTime: "15 minutes",
        priority: "high",
        formRequired: true,
        instructions: [
          "Visit the ATO website",
          "Complete the online TFN application",
          "Provide your visa details and passport information",
          "Submit the application - you'll receive your TFN by mail in 10-14 days",
        ],
        completed: false,
      },
      {
        id: "medicare",
        title: "Apply for Medicare Card",
        description: "Access to Australia's public health system",
        type: "offline",
        estimatedTime: "30 minutes",
        priority: "high",
        location: "Medicare Service Centre",
        instructions: [
          "Gather required documents: passport, visa, proof of address",
          "Visit your nearest Medicare Service Centre",
          "Complete the Medicare enrollment form",
          "Submit documents and receive temporary card immediately",
        ],
        completed: false,
      },
      {
        id: "bank-account",
        title: "Open Australian Bank Account",
        description: "Essential for receiving salary and managing finances",
        type: "offline",
        estimatedTime: "45 minutes",
        priority: "high",
        dependencies: ["tfn"],
        location: "Bank Branch",
        instructions: [
          "Choose a bank and find the nearest branch",
          "Bring passport, visa, and proof of address",
          "Apply within 6 weeks of arrival for easier requirements",
          "Set up online banking and get your debit card",
        ],
        completed: false,
      },
      {
        id: "driver-license",
        title: "Convert Overseas Driver License",
        description: "Convert your overseas license to NSW license",
        type: "offline",
        estimatedTime: "1 hour",
        priority: "medium",
        location: "Service NSW Centre",
        formRequired: true,
        instructions: [
          "Book an appointment at Service NSW",
          "Bring your overseas license and official translation",
          "Complete the driver license application form",
          "Pass knowledge test if required",
          "Pay the license fee and receive temporary license",
        ],
        completed: false,
      },
    ],
    "new-baby": [
      {
        id: "birth-certificate",
        title: "Register Birth and Get Birth Certificate",
        description: "Official registration of your baby's birth",
        type: "online",
        estimatedTime: "20 minutes",
        priority: "high",
        formRequired: true,
        instructions: [
          "Complete birth registration online within 60 days",
          "Provide hospital birth notification details",
          "Choose baby's name and spelling carefully",
          "Pay fee and order birth certificate",
          "Certificate will arrive by mail in 5-10 business days",
        ],
        completed: false,
      },
      {
        id: "medicare-baby",
        title: "Add Baby to Medicare",
        description: "Ensure your baby has health coverage",
        type: "offline",
        estimatedTime: "30 minutes",
        priority: "high",
        dependencies: ["birth-certificate"],
        location: "Medicare Service Centre",
        instructions: [
          "Wait for birth certificate to arrive",
          "Visit Medicare Service Centre with birth certificate",
          "Bring your Medicare card and ID",
          "Complete newborn enrollment form",
          "Receive updated Medicare card with baby included",
        ],
        completed: false,
      },
      {
        id: "centrelink-baby",
        title: "Apply for Family Tax Benefit",
        description: "Financial assistance for families with children",
        type: "online",
        estimatedTime: "30 minutes",
        priority: "medium",
        dependencies: ["birth-certificate"],
        formRequired: true,
        instructions: [
          "Create myGov account if you don't have one",
          "Link Centrelink to your myGov account",
          "Complete Family Tax Benefit application online",
          "Provide birth certificate and income details",
          "Submit application and wait for assessment",
        ],
        completed: false,
      },
    ],
    "storm-damage": [
      {
        id: "emergency-assistance",
        title: "Apply for Emergency Financial Assistance",
        description: "Immediate financial help for storm damage",
        type: "online",
        estimatedTime: "20 minutes",
        priority: "high",
        formRequired: true,
        instructions: [
          "Visit Service NSW website",
          "Complete Disaster Relief Grant application",
          "Provide photos of damage and insurance details",
          "Submit application with proof of identity",
          "Funds typically available within 48 hours",
        ],
        completed: false,
      },
      {
        id: "insurance-claim",
        title: "Lodge Insurance Claim",
        description: "Report damage to your insurance company",
        type: "online",
        estimatedTime: "45 minutes",
        priority: "high",
        instructions: [
          "Contact your insurance company immediately",
          "Take detailed photos of all damage",
          "Complete insurance claim form online or by phone",
          "Schedule assessor visit if required",
          "Keep all receipts for temporary repairs",
        ],
        completed: false,
      },
      {
        id: "temporary-accommodation",
        title: "Find Temporary Accommodation",
        description: "Secure safe housing while repairs are completed",
        type: "offline",
        estimatedTime: "2 hours",
        priority: "high",
        location: "Local Council or Red Cross",
        instructions: [
          "Contact local council for emergency accommodation",
          "Check with Red Cross for evacuation centers",
          "Arrange temporary rental if insurance covers it",
          "Notify utility companies of temporary address change",
        ],
        completed: false,
      },
    ],
    "change-address": [
      {
        id: "electoral-roll",
        title: "Update Electoral Roll",
        description: "Update your voting address",
        type: "online",
        estimatedTime: "5 minutes",
        priority: "medium",
        formRequired: true,
        instructions: [
          "Visit Australian Electoral Commission website",
          "Complete online enrollment form",
          "Provide new address details",
          "Submit form - update is immediate",
        ],
        completed: false,
      },
      {
        id: "driver-license-address",
        title: "Update Driver License Address",
        description: "Change address on your NSW driver license",
        type: "online",
        estimatedTime: "10 minutes",
        priority: "high",
        formRequired: true,
        instructions: [
          "Log into Service NSW website",
          "Select 'Change address on driver license'",
          "Enter new address details",
          "Pay the change fee online",
          "New license will be mailed to new address",
        ],
        completed: false,
      },
      {
        id: "medicare-address",
        title: "Update Medicare Address",
        description: "Ensure Medicare correspondence reaches you",
        type: "online",
        estimatedTime: "5 minutes",
        priority: "medium",
        instructions: [
          "Log into myGov account",
          "Access Medicare online services",
          "Update personal details section",
          "Change address and contact information",
          "Confirm changes are saved",
        ],
        completed: false,
      },
    ],
    "business-registration": [
      {
        id: "abn",
        title: "Apply for Australian Business Number (ABN)",
        description: "Essential identifier for your business",
        type: "online",
        estimatedTime: "20 minutes",
        priority: "high",
        formRequired: true,
        instructions: [
          "Visit Australian Business Register website",
          "Complete ABN application form",
          "Provide business structure and activity details",
          "Submit application - ABN issued immediately if eligible",
        ],
        completed: false,
      },
      {
        id: "business-name",
        title: "Register Business Name",
        description: "Protect your business name legally",
        type: "online",
        estimatedTime: "15 minutes",
        priority: "medium",
        dependencies: ["abn"],
        formRequired: true,
        instructions: [
          "Search available business names on ASIC website",
          "Complete business name registration",
          "Pay registration fee",
          "Receive business name certificate",
        ],
        completed: false,
      },
      {
        id: "business-licenses",
        title: "Apply for Required Business Licenses",
        description: "Obtain necessary permits for your business type",
        type: "online",
        estimatedTime: "1 hour",
        priority: "high",
        dependencies: ["abn"],
        location: "Various Government Agencies",
        instructions: [
          "Use Business License Information Service to identify required licenses",
          "Apply for each license separately",
          "Provide business details and compliance information",
          "Pay license fees and wait for approval",
        ],
        completed: false,
      },
    ],
  }

  return baseSteps[scenario.id] || []
}

export function RoadmapView({
  scenario,
  userResponses,
  onBack,
  onBackToScenarios,
  messages = [],
  onTroubleshooting,
}: RoadmapViewProps) {
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([])
  const [locationPermission, setLocationPermission] = useState<boolean>(false)
  const [selectedFormStep, setSelectedFormStep] = useState<RoadmapStep | null>(null)
  const [selectedLocationStep, setSelectedLocationStep] = useState<RoadmapStep | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showChatHistory, setShowChatHistory] = useState(false)

  useEffect(() => {
    const steps = generateRoadmap(scenario, userResponses)
    setRoadmapSteps(steps)
  }, [scenario, userResponses])

  const handleStepToggle = (stepId: string) => {
    setRoadmapSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: !step.completed } : step)))
  }

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Location access denied:", error)
          setLocationPermission(false)
        },
      )
    }
  }

  const handleFormGuide = (step: RoadmapStep) => {
    setSelectedFormStep(step)
  }

  const handleCloseFormAssistance = () => {
    setSelectedFormStep(null)
  }

  const handleFindNearest = (step: RoadmapStep) => {
    setSelectedLocationStep(step)
  }

  const handleCloseLocationFinder = () => {
    setSelectedLocationStep(null)
  }

  const handleShowChatHistory = () => {
    setShowChatHistory(true)
  }

  const handleCloseChatHistory = () => {
    setShowChatHistory(false)
  }

  const handleEditResponse = (responseIndex: number, newAnswer: string) => {
    // This would update the user responses and potentially regenerate the roadmap
    console.log("Editing response:", responseIndex, newAnswer)
  }

  const totalSteps = roadmapSteps.length
  const completedSteps = roadmapSteps.filter((step) => step.completed).length
  const totalTime = roadmapSteps.reduce((acc, step) => {
    const time = Number.parseInt(step.estimatedTime.split(" ")[0])
    const unit = step.estimatedTime.includes("hour") ? 60 : 1
    return acc + time * unit
  }, 0)

  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  }

  if (selectedFormStep) {
    return <FormAssistance step={selectedFormStep} userResponses={userResponses} onBack={handleCloseFormAssistance} />
  }

  if (selectedLocationStep) {
    return <LocationFinder step={selectedLocationStep} userLocation={userLocation} onBack={handleCloseLocationFinder} />
  }

  if (showChatHistory) {
    return (
      <ChatHistory
        messages={messages}
        userResponses={userResponses}
        onBack={handleCloseChatHistory}
        onEditResponse={handleEditResponse}
        onTroubleshooting={onTroubleshooting || (() => {})}
      />
    )
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
          <Button variant="ghost" onClick={onBackToScenarios} className="flex items-center gap-2">
            Back to Scenarios
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              onClick={handleShowChatHistory}
              className="flex items-center gap-2 bg-transparent"
            >
              <History className="h-4 w-4" />
              Chat History
            </Button>
          )}
          {onTroubleshooting && (
            <Button variant="outline" onClick={onTroubleshooting} className="flex items-center gap-2 bg-transparent">
              <HelpCircle className="h-4 w-4" />
              Get Help
            </Button>
          )}
          {!locationPermission && (
            <Button variant="outline" onClick={requestLocation} className="flex items-center gap-2 bg-transparent">
              <Navigation className="h-4 w-4" />
              Enable Location for Nearby Services
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {scenario && (
                <>
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">{scenario.icon}</div>
                  <div>
                    <CardTitle className="text-xl">Your Personalized Roadmap</CardTitle>
                    <p className="text-muted-foreground">{scenario.title}</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-secondary">
                {completedSteps}/{totalSteps}
              </div>
              <p className="text-sm text-muted-foreground">Steps Completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Total Time</p>
                <p className="text-sm text-muted-foreground">
                  {totalTime >= 60 ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}m` : `${totalTime}m`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Online Steps</p>
                <p className="text-sm text-muted-foreground">
                  {roadmapSteps.filter((s) => s.type === "online").length} of {totalSteps}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">In-Person Steps</p>
                <p className="text-sm text-muted-foreground">
                  {roadmapSteps.filter((s) => s.type === "offline").length} of {totalSteps}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-secondary h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {roadmapSteps.map((step, index) => (
          <Card key={step.id} className={`transition-all ${step.completed ? "bg-muted/50" : ""}`}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Checkbox checked={step.completed} onCheckedChange={() => handleStepToggle(step.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                      {index + 1}. {step.title}
                    </h3>
                    <Badge variant="secondary" className={priorityColors[step.priority]}>
                      {step.priority} priority
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {step.type === "online" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {step.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{step.description}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {step.estimatedTime}
                    </div>
                    {step.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {step.location}
                        {locationPermission && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => handleFindNearest(step)}
                          >
                            Find Nearest
                          </Button>
                        )}
                      </div>
                    )}
                    {step.formRequired && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Form Required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="ml-8">
                <h4 className="font-medium mb-2">Step-by-step instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {step.instructions.map((instruction, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      {instruction}
                    </li>
                  ))}
                </ol>

                {step.dependencies && step.dependencies.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-800">Prerequisites</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Complete these steps first:{" "}
                      {step.dependencies.map((dep) => roadmapSteps.find((s) => s.id === dep)?.title).join(", ")}
                    </p>
                  </div>
                )}

                {step.formRequired && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                      onClick={() => handleFormGuide(step)}
                    >
                      <FileText className="h-4 w-4" />
                      View Form Guide & Get Help
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {completedSteps === totalSteps && totalSteps > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Congratulations!</h3>
                <p className="text-green-700">You've completed all steps in your roadmap.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
