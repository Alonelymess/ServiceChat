"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sendMessageToApi } from "@/lib/api"
import { ArrowLeft, Bot, CheckCircle2, XCircle, MapPin } from "lucide-react"

const SERVICES = [
  { id: "service_nsw", label: "Service NSW (Driver Licence, Vehicle Registration)" },
  { id: "ato", label: "Australian Tax Office (ATO)" },
  { id: "medicare", label: "Medicare / myGov" },
  { id: "centrelink", label: "Centrelink" },
  { id: "electoral", label: "Electoral Commission" },
  { id: "bank", label: "Bank / Financial institutions" },
  { id: "super", label: "Superannuation fund" },
  { id: "utilities", label: "Utilities (electricity, gas, water)" },
  { id: "internet", label: "Internet / Phone provider" },
  { id: "insurance", label: "Insurance providers" },
  { id: "employer", label: "Employer / HR" },
  { id: "australia_post", label: "Australia Post mail redirection" },
]

export function ChangeAddressForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    oldAddress: "",
    newAddress: "",
    moveDate: "",
    licenceNumber: "",
    vehicleRego: "",
    email: "",
    phone: "",
    services: {} as Record<string, boolean>,
  })

  const [formStatus, setFormStatus] = useState<"draft" | "submitted" | "approved" | "declined">("draft")
  const [declineReason, setDeclineReason] = useState("")
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        services: { ...prev.services, [name]: checked },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus("submitted")
    setTimeout(() => {
      setFormStatus(Math.random() > 0.3 ? "approved" : "declined")
      if (formStatus === "declined") {
        setDeclineReason("Missing required fields. Please complete all mandatory information.")
      }
    }, 2000)
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    const formSummary = `
Current address: ${form.oldAddress || "Not provided"}
New address: ${form.newAddress || "Not provided"}
Move date: ${form.moveDate || "Not provided"}
Services to update: ${Object.entries(form.services).filter(([, v]) => v).map(([k]) => k).join(", ") || "None selected"}
    `.trim()
    const prompt = `User question about address change process: ${chatInput}\n\nCurrent form state:\n${formSummary}`
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])
    setChatLoading(true)
    try {
      const reply = await sendMessageToApi(prompt, "change-address", userId)
      setChatMessages((prev) => [...prev, { role: "bot", content: typeof reply === "string" ? reply : JSON.stringify(reply) }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", content: "Sorry, I couldn't get an answer right now." }])
    }
    setChatInput("")
    setChatLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.location.assign("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Main Page
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Change of Address</h2>
            <p className="text-sm text-muted-foreground">Update your address across NSW government services</p>
          </div>
        </div>
        <div className="ml-auto">
          {formStatus === "submitted" && <Badge className="bg-blue-100 text-blue-800">Processing…</Badge>}
          {formStatus === "approved" && <Badge className="bg-green-100 text-green-800">Submitted</Badge>}
          {formStatus === "declined" && <Badge className="bg-red-100 text-red-800">Declined</Badge>}
        </div>
      </div>

      {formStatus === "declined" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Submission Declined</h3>
                <p className="text-sm text-red-700 mb-3">{declineReason}</p>
                <Button size="sm" onClick={() => { setFormStatus("draft"); setDeclineReason("") }}>
                  Fix & Resubmit
                </Button>
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
                <h3 className="font-semibold text-green-800">Address Update Submitted!</h3>
                <p className="text-sm text-green-700">Your address change request has been lodged. Check your email for confirmation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Address Change Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Your Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="As shown on your licence" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input name="dob" type="date" value={form.dob} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input name="email" type="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Address info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Address Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Current / Old Address</Label>
                    <Input name="oldAddress" value={form.oldAddress} onChange={handleChange} required placeholder="Full street address, suburb, postcode" />
                  </div>
                  <div>
                    <Label>New Address</Label>
                    <Input name="newAddress" value={form.newAddress} onChange={handleChange} required placeholder="Full street address, suburb, postcode" />
                  </div>
                  <div>
                    <Label>Date of Move</Label>
                    <Input name="moveDate" type="date" value={form.moveDate} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Driver licence / vehicle */}
              <div>
                <h3 className="font-semibold text-lg mb-3">NSW Licence & Registration</h3>
                <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-4 rounded flex gap-2 items-start mb-3">
                  <span className="text-blue-700 font-bold mt-0.5">i</span>
                  <p className="text-sm text-blue-900">NSW legislation requires you to update your driver licence address within 3 months of moving. You must also update vehicle registration records.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Driver Licence Number (optional)</Label>
                    <Input name="licenceNumber" value={form.licenceNumber} onChange={handleChange} placeholder="e.g. 12345678" />
                  </div>
                  <div>
                    <Label>Vehicle Registration Plate (optional)</Label>
                    <Input name="vehicleRego" value={form.vehicleRego} onChange={handleChange} placeholder="e.g. ABC123" />
                  </div>
                </div>
              </div>

              {/* Services checklist */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Services to Update</h3>
                <p className="text-sm text-muted-foreground mb-3">Select all the services where you need to update your address.</p>
                <div className="space-y-2">
                  {SERVICES.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        name={s.id}
                        checked={!!form.services[s.id]}
                        onChange={handleChange}
                        className="rounded"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={formStatus === "submitted"}>
                {formStatus === "submitted" ? "Submitting…" : "Submit Address Change"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chat assistant */}
        <div className="sticky top-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-secondary" />
                Address Change Help
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50 rounded mb-2">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ask a question about updating your address…</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm p-2 rounded-lg break-words max-w-full ${msg.role === "user" ? "bg-blue-200 text-right ml-8" : "bg-white mr-8 border"}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                {chatLoading && <p className="text-xs text-blue-600">Assistant is typing…</p>}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleChatSend() }}>
                <input
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="Ask a question…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <Button type="submit" size="sm" disabled={chatLoading || !chatInput.trim()}>Send</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
