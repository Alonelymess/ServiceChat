"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sendMessageToApi } from "@/lib/api"
import { ArrowLeft, Bot, CheckCircle2, XCircle, CloudLightning } from "lucide-react"

const DAMAGE_TYPES = [
  { id: "roof", label: "Roof damage" },
  { id: "flooding", label: "Internal flooding / water damage" },
  { id: "fallen_tree", label: "Fallen tree / branches" },
  { id: "fencing", label: "Fencing damage" },
  { id: "windows", label: "Broken windows / doors" },
  { id: "electrical", label: "Electrical damage" },
  { id: "vehicle", label: "Vehicle damage" },
  { id: "contents", label: "Contents / belongings" },
  { id: "other", label: "Other structural damage" },
]

const EMERGENCY_SERVICES = [
  { id: "ses", label: "NSW SES (State Emergency Service) — 132 500" },
  { id: "fire", label: "NSW Rural Fire Service" },
  { id: "police", label: "NSW Police" },
  { id: "power", label: "Ausgrid / Endeavour Energy (power outage)" },
]

export function StormDamageForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    propertyAddress: "",
    isOwner: "",
    insuranceProvider: "",
    policyNumber: "",
    stormDate: "",
    stormTime: "",
    incidentDescription: "",
    damageTypes: {} as Record<string, boolean>,
    emergencyServicesContacted: {} as Record<string, boolean>,
    propertyOccupied: "",
    safeToEnter: "",
    immediateHazards: "",
    estimatedDamage: "",
    declaration: false,
  })

  const [step, setStep] = useState(1)
  const [formStatus, setFormStatus] = useState<"draft" | "submitted" | "approved" | "declined">("draft")
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    if (type === "checkbox") {
      // Distinguish damageTypes vs emergencyServices checkboxes
      if (DAMAGE_TYPES.find((d) => d.id === name)) {
        setForm((prev) => ({ ...prev, damageTypes: { ...prev.damageTypes, [name]: checked } }))
      } else if (EMERGENCY_SERVICES.find((s) => s.id === name)) {
        setForm((prev) => ({ ...prev, emergencyServicesContacted: { ...prev.emergencyServicesContacted, [name]: checked } }))
      } else {
        setForm((prev) => ({ ...prev, [name]: checked }))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus("submitted")
    setTimeout(() => setFormStatus(Math.random() > 0.3 ? "approved" : "declined"), 2000)
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    const formSummary = `
Property: ${form.propertyAddress || "Not provided"}
Storm date: ${form.stormDate || "Not provided"}
Damage types: ${Object.entries(form.damageTypes).filter(([, v]) => v).map(([k]) => k).join(", ") || "None selected"}
Safe to enter: ${form.safeToEnter || "Unknown"}
Insurance provider: ${form.insuranceProvider || "Not provided"}
    `.trim()
    const prompt = `User question about storm damage claim: ${chatInput}\n\nCurrent form state:\n${formSummary}`
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])
    setChatLoading(true)
    try {
      const reply = await sendMessageToApi(prompt, "storm-damage", userId)
      setChatMessages((prev) => [...prev, { role: "bot", content: typeof reply === "string" ? reply : JSON.stringify(reply) }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", content: "Sorry, I couldn't get an answer right now." }])
    }
    setChatInput("")
    setChatLoading(false)
  }

  const STEPS = ["Your Details", "Incident Info", "Damage Report", "Emergency & Insurance"]

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
            <CloudLightning className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Storm Damage Report</h2>
            <p className="text-sm text-muted-foreground">Report storm damage and get assistance</p>
          </div>
        </div>
        <div className="ml-auto">
          {formStatus === "submitted" && <Badge className="bg-blue-100 text-blue-800">Processing…</Badge>}
          {formStatus === "approved" && <Badge className="bg-green-100 text-green-800">Lodged</Badge>}
          {formStatus === "declined" && <Badge className="bg-red-100 text-red-800">Declined</Badge>}
        </div>
      </div>

      {/* Emergency banner */}
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
        <span className="text-red-600 font-bold text-lg">!</span>
        <div className="text-sm text-red-900">
          <span className="font-semibold">In immediate danger?</span> Call <strong>000</strong>. For SES storm assistance call <strong>132 500</strong>. For life-threatening electrical hazards call your electricity network provider.
        </div>
      </div>

      {formStatus === "declined" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Report Declined</h3>
                <p className="text-sm text-red-700 mb-3">Missing required fields. Please complete all sections.</p>
                <Button size="sm" onClick={() => setFormStatus("draft")}>Fix & Resubmit</Button>
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
                <h3 className="font-semibold text-green-800">Report Lodged!</h3>
                <p className="text-sm text-green-700">Your storm damage report has been submitted. A reference number will be emailed to you.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            {/* Step indicators */}
            <div className="flex gap-1 mb-2">
              {STEPS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i + 1)}
                  className={`flex-1 h-2 rounded-full transition-colors ${step === i + 1 ? "bg-secondary" : step > i + 1 ? "bg-secondary/40" : "bg-muted"}`}
                  title={label}
                />
              ))}
            </div>
            <CardTitle className="text-base">Step {step}: {STEPS[step - 1]}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <Label>Full Name</Label>
                    <Input name="fullName" value={form.fullName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input name="email" type="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Property Address (affected)</Label>
                    <Input name="propertyAddress" value={form.propertyAddress} onChange={handleChange} required placeholder="Full street address, suburb, postcode" />
                  </div>
                  <div>
                    <Label>Are you the property owner?</Label>
                    <div className="flex gap-6 mt-1">
                      {["Yes", "No — Renting", "No — Other"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="isOwner" value={opt} checked={form.isOwner === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="button" className="w-full" onClick={() => setStep(2)}>Next →</Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Date of Storm / Incident</Label>
                    <Input name="stormDate" type="date" value={form.stormDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Approximate Time</Label>
                    <Input name="stormTime" type="time" value={form.stormTime} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Is the property currently occupied?</Label>
                    <div className="flex gap-6 mt-1">
                      {["Yes", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="propertyOccupied" value={opt} checked={form.propertyOccupied === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Is the property safe to enter?</Label>
                    <div className="flex gap-6 mt-1">
                      {["Yes", "No", "Unsure"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="safeToEnter" value={opt} checked={form.safeToEnter === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {form.safeToEnter === "No" && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-2 rounded text-sm text-red-800">
                        Do not enter the property until it has been assessed as safe. Contact NSW SES on 132 500.
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Describe any immediate hazards</Label>
                    <textarea name="immediateHazards" value={form.immediateHazards} onChange={handleChange} rows={3} className="w-full border rounded p-2 text-sm" placeholder="e.g. downed power line, gas leak, structural instability" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>← Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setStep(3)}>Next →</Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <Label className="mb-2 block">Types of Damage (select all that apply)</Label>
                    <div className="space-y-2">
                      {DAMAGE_TYPES.map((d) => (
                        <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <input type="checkbox" name={d.id} checked={!!form.damageTypes[d.id]} onChange={handleChange} />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Description of Damage</Label>
                    <textarea
                      name="incidentDescription"
                      value={form.incidentDescription}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Describe the storm damage in detail…"
                      required
                    />
                  </div>
                  <div>
                    <Label>Estimated Value of Damage (optional)</Label>
                    <Input name="estimatedDamage" value={form.estimatedDamage} onChange={handleChange} placeholder="e.g. $5,000 – $10,000" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>← Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setStep(4)}>Next →</Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div>
                    <Label className="mb-2 block">Emergency Services Contacted</Label>
                    <div className="space-y-2">
                      {EMERGENCY_SERVICES.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <input type="checkbox" name={s.id} checked={!!form.emergencyServicesContacted[s.id]} onChange={handleChange} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Insurance Provider</Label>
                    <Input name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} placeholder="e.g. NRMA, Allianz, Suncorp" />
                  </div>
                  <div>
                    <Label>Policy Number (optional)</Label>
                    <Input name="policyNumber" value={form.policyNumber} onChange={handleChange} />
                  </div>
                  <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-4 rounded text-sm text-blue-900">
                    <strong>Tip:</strong> Document all damage with photos before any repairs. Keep all repair receipts. Contact your insurer as soon as possible.
                  </div>
                  <div>
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" name="declaration" checked={form.declaration} onChange={handleChange} required className="mt-0.5" />
                      I declare that the information provided is true and accurate to the best of my knowledge.
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(3)}>← Back</Button>
                    <Button type="submit" className="flex-1" disabled={formStatus === "submitted"}>
                      {formStatus === "submitted" ? "Submitting…" : "Submit Report"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Chat assistant */}
        <div className="sticky top-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-secondary" />
                Storm Damage Assistance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50 rounded mb-2">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ask about the claims process, what to do next, or eligible assistance…</p>
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
