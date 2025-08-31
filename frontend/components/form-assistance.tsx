"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Bot, HelpCircle, CheckCircle2, AlertTriangle, Camera, XCircle } from "lucide-react"

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

interface UserResponse {
  questionIndex: number
  question: string
  answer: string
}

interface FormField {
  id: string
  label: string
  type: "text" | "email" | "tel" | "select" | "textarea" | "date"
  required: boolean
  placeholder?: string
  options?: string[]
  guidance: string
  prefilledValue?: string
}

interface FormAssistanceProps {
  step: RoadmapStep
  userResponses: UserResponse[]
  onBack: () => void
}

const getFormTemplate = (stepId: string, userResponses: UserResponse[]): FormField[] => {
  const responseMap = userResponses.reduce(
    (acc, response) => {
      acc[response.question.toLowerCase()] = response.answer
      return acc
    },
    {} as Record<string, string>,
  )

  const templates: Record<string, FormField[]> = {
    tfn: [
      {
        id: "title",
        label: "Title",
        type: "select",
        required: false,
        options: ["Mr", "Ms", "Mrs", "Dr", "Prof"],
        guidance: "Select your preferred title. This is optional but helps with official correspondence.",
      },
      {
        id: "firstName",
        label: "First Name",
        type: "text",
        required: true,
        placeholder: "Enter your first name",
        guidance: "Enter your first name exactly as it appears on your passport or visa documents.",
        prefilledValue: responseMap["first name"] || "",
      },
      {
        id: "lastName",
        label: "Last Name",
        type: "text",
        required: true,
        placeholder: "Enter your last name",
        guidance: "Enter your surname/family name exactly as it appears on your passport or visa documents.",
        prefilledValue: responseMap["last name"] || "",
      },
      {
        id: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        required: true,
        guidance: "Enter your date of birth in DD/MM/YYYY format. This must match your passport.",
      },
      {
        id: "visaType",
        label: "Visa Type",
        type: "select",
        required: true,
        options: [
          "Student Visa (500)",
          "Working Holiday (417)",
          "Skilled Independent (189)",
          "Partner Visa (820)",
          "Other",
        ],
        guidance: "Select the visa type that matches your current Australian visa.",
        prefilledValue: responseMap["what type of visa do you have?"] || "",
      },
      {
        id: "passportNumber",
        label: "Passport Number",
        type: "text",
        required: true,
        placeholder: "Enter passport number",
        guidance: "Enter your passport number without spaces. This is usually 8-9 characters long.",
      },
      {
        id: "countryOfBirth",
        label: "Country of Birth",
        type: "text",
        required: true,
        placeholder: "Enter country of birth",
        guidance: "Enter the country where you were born, not your nationality.",
      },
    ],
    "birth-certificate": [
      {
        id: "babyFirstName",
        label: "Baby's First Name",
        type: "text",
        required: true,
        placeholder: "Enter baby's first name",
        guidance:
          "Choose carefully - this will be your child's legal name. Avoid unusual spellings that may cause issues later.",
      },
      {
        id: "babyLastName",
        label: "Baby's Last Name",
        type: "text",
        required: true,
        placeholder: "Enter baby's last name",
        guidance:
          "This can be either parent's surname or a combination. Consider how it will appear on official documents.",
      },
      {
        id: "birthDate",
        label: "Date of Birth",
        type: "date",
        required: true,
        guidance: "Enter the exact date and time from the hospital birth notification.",
      },
      {
        id: "birthPlace",
        label: "Place of Birth",
        type: "text",
        required: true,
        placeholder: "Hospital name and suburb",
        guidance: "Enter the full name of the hospital or birthing center where your baby was born.",
        prefilledValue: responseMap["where was your baby born?"] || "",
      },
      {
        id: "motherName",
        label: "Mother's Full Name",
        type: "text",
        required: true,
        placeholder: "Enter mother's full name",
        guidance: "Enter the mother's full legal name as it appears on official documents.",
      },
      {
        id: "fatherName",
        label: "Father's Full Name",
        type: "text",
        required: false,
        placeholder: "Enter father's full name",
        guidance: "Enter the father's full legal name. Leave blank if not applicable.",
      },
    ],
    "emergency-assistance": [
      {
        id: "incidentDate",
        label: "Date of Incident",
        type: "date",
        required: true,
        guidance: "Enter the date when the storm damage occurred. This helps determine eligibility.",
      },
      {
        id: "propertyAddress",
        label: "Property Address",
        type: "textarea",
        required: true,
        placeholder: "Enter full property address",
        guidance: "Provide the complete address of the damaged property including postcode.",
      },
      {
        id: "damageType",
        label: "Type of Damage",
        type: "select",
        required: true,
        options: ["Roof damage", "Flooding", "Structural damage", "Contents damage", "Multiple types"],
        guidance: "Select the primary type of damage. You can provide more details in the description field.",
        prefilledValue: responseMap["what type of damage occurred?"] || "",
      },
      {
        id: "damageDescription",
        label: "Damage Description",
        type: "textarea",
        required: true,
        placeholder: "Describe the damage in detail",
        guidance: "Provide a detailed description of all damage. This helps assessors understand the extent of impact.",
      },
      {
        id: "insuranceStatus",
        label: "Insurance Status",
        type: "select",
        required: true,
        options: ["Fully insured", "Partially insured", "Not insured", "Claim denied"],
        guidance: "Select your insurance situation. This affects the type of assistance available.",
        prefilledValue: responseMap["do you have insurance?"] || "",
      },
    ],
  }

  return templates[stepId] || []
}

export function FormAssistance({ step, userResponses, onBack }: FormAssistanceProps) {
  const [formFields, setFormFields] = useState<FormField[]>(() => getFormTemplate(step.id, userResponses))
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [showFormImage, setShowFormImage] = useState(true)
  const [needsHelp, setNeedsHelp] = useState<boolean | null>(null)
  const [uploadedForm, setUploadedForm] = useState<File | null>(null)
  const [formStatus, setFormStatus] = useState<"draft" | "submitted" | "declined" | "approved">("draft")
  const [declineReason, setDeclineReason] = useState("")

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleFormUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedForm(file)
      setShowFormImage(false)
    }
  }

  const handleSubmitForm = () => {
    setFormStatus("submitted")
    // Simulate form processing
    setTimeout(() => {
      // Randomly simulate approval or decline for demo
      const isApproved = Math.random() > 0.3
      if (isApproved) {
        setFormStatus("approved")
      } else {
        setFormStatus("declined")
        setDeclineReason(
          "Missing required documentation. Please ensure all fields are completed accurately and upload supporting documents.",
        )
      }
    }, 2000)
  }

  const handleFixIssues = () => {
    setFormStatus("draft")
    setDeclineReason("")
  }

  const prefilledCount = formFields.filter((field) => field.prefilledValue).length
  const totalFields = formFields.length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Form Assistance</h2>
            <p className="text-sm text-muted-foreground">{step.title}</p>
          </div>
        </div>

        {/* Added form status indicator */}
        <div className="ml-auto">
          {formStatus === "submitted" && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Processing...
            </Badge>
          )}
          {formStatus === "approved" && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Approved
            </Badge>
          )}
          {formStatus === "declined" && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Declined
            </Badge>
          )}
        </div>
      </div>

      {/* Added form decline handling */}
      {formStatus === "declined" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Form Declined</h3>
                <p className="text-sm text-red-700 mb-4">{declineReason}</p>
                <div className="flex gap-2">
                  <Button onClick={handleFixIssues} size="sm">
                    Fix Issues & Resubmit
                  </Button>
                  <Button variant="outline" onClick={onBack} size="sm" className="bg-transparent">
                    Review Chat History
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formStatus === "approved" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Form Approved!</h3>
                <p className="text-sm text-green-700">Your application has been successfully submitted and approved.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Form Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showFormImage ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <div className="w-full h-64 bg-white border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Form preview would appear here</p>
                        <p className="text-sm text-muted-foreground mt-1">Official {step.title.toLowerCase()} form</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Is this form different from what you're seeing? Upload the current version below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="form-upload">Upload Current Form (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="form-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFormUpload}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a photo or PDF of the current form if it looks different
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Form uploaded successfully</p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Using your uploaded form: {uploadedForm?.name}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowFormImage(true)} className="w-full bg-transparent">
                    Use Standard Form Instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-secondary" />
                AI Form Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsHelp === null ? (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/5 rounded-lg">
                    <p className="text-sm mb-3">
                      I can help you fill out this form using the information you provided earlier.
                    </p>
                    {prefilledCount > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          {prefilledCount} of {totalFields} fields can be pre-filled
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-3">
                    <p className="font-medium">Do you need help filling out this form?</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setNeedsHelp(true)} className="flex-1">
                        Yes, help me fill it out
                      </Button>
                      <Button variant="outline" onClick={() => setNeedsHelp(false)} className="flex-1 bg-transparent">
                        No, I'll do it myself
                      </Button>
                    </div>
                  </div>
                </div>
              ) : needsHelp ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">Great! I'll guide you through each field.</p>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {formFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={field.id} className="font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          {field.prefilledValue && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              Pre-filled
                            </Badge>
                          )}
                        </div>

                        {field.type === "select" ? (
                          <Select
                            value={formData[field.id] || field.prefilledValue || ""}
                            onValueChange={(value) => handleFieldChange(field.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "textarea" ? (
                          <Textarea
                            id={field.id}
                            value={formData[field.id] || field.prefilledValue || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <Input
                            id={field.id}
                            type={field.type}
                            value={formData[field.id] || field.prefilledValue || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}

                        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-800">{field.guidance}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    {formStatus === "draft" ? (
                      <Button onClick={handleSubmitForm} className="w-full">
                        Submit Form
                      </Button>
                    ) : formStatus === "submitted" ? (
                      <Button disabled className="w-full">
                        Processing...
                      </Button>
                    ) : (
                      <Button onClick={handleSubmitForm} className="w-full">
                        Resubmit Form
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This will submit your form data for processing
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No problem! Here are some quick tips for filling out the form:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Double-check all dates match your official documents</li>
                      <li>Use the exact spelling from your passport or visa</li>
                      <li>Keep supporting documents ready for upload</li>
                      <li>Save your progress regularly</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Key Information:</h4>
                    {prefilledCount > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          Based on our conversation, I can pre-fill {prefilledCount} fields for you. You can still
                          review and edit them if needed.
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        If you get stuck or need help with any field, you can always come back and ask for assistance.
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => setNeedsHelp(true)} className="w-full bg-transparent">
                    Actually, I'd like help filling it out
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
