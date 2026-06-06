"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sendMessageToApi } from "@/lib/api"
import { ArrowLeft, Bot, CheckCircle2, Plane, ExternalLink } from "lucide-react"

const VISA_TYPES = [
  { value: "skilled_independent", label: "Skilled — Independent (189)" },
  { value: "skilled_nominated", label: "Skilled — Nominated (190 / 491)" },
  { value: "employer_sponsored", label: "Employer Sponsored (482 / 186)" },
  { value: "partner", label: "Partner / Spouse (820 / 801)" },
  { value: "student", label: "Student (500)" },
  { value: "working_holiday", label: "Working Holiday (417 / 462)" },
  { value: "humanitarian", label: "Humanitarian / Refugee" },
  { value: "other", label: "Other" },
]

const ESSENTIALS = [
  {
    category: "Identity & Tax",
    items: [
      { id: "tfn", label: "Apply for a Tax File Number (TFN)", link: "https://www.ato.gov.au/individuals/tax-file-number/apply-for-a-tfn/foreign-passport-holders,-permanent-migrants-and-temporary-visitors---tfn-application/", required: true },
      { id: "mygov", label: "Create a myGov account", link: "https://my.gov.au/", required: true },
      { id: "medicare", label: "Enrol in Medicare (if eligible)", link: "https://www.servicesaustralia.gov.au/how-to-enrol-in-medicare", required: false },
    ],
  },
  {
    category: "NSW Driving",
    items: [
      { id: "convert_licence", label: "Convert overseas driver licence to NSW licence", link: "https://www.service.nsw.gov.au/transaction/apply-for-nsw-driver-licence-overseas-licence-holder", required: false },
      { id: "car_rego", label: "Register vehicle in NSW (if applicable)", link: "https://www.service.nsw.gov.au/transaction/register-vehicle", required: false },
    ],
  },
  {
    category: "Banking & Finance",
    items: [
      { id: "bank_account", label: "Open an Australian bank account", link: "", required: true },
      { id: "super", label: "Set up superannuation fund", link: "https://www.ato.gov.au/individuals/super/getting-started-with-super/", required: false },
    ],
  },
  {
    category: "Accommodation & Utilities",
    items: [
      { id: "accommodation", label: "Secure long-term accommodation", link: "", required: true },
      { id: "utilities", label: "Connect electricity, gas, internet", link: "", required: false },
      { id: "australia_post", label: "Set up mail forwarding / PO Box if needed", link: "https://auspost.com.au/", required: false },
    ],
  },
  {
    category: "Community & Support",
    items: [
      { id: "english", label: "Enrol in AMEP (free English classes for migrants)", link: "https://www.amepaustralia.com.au/", required: false },
      { id: "settlement", label: "Contact a settlement service for support", link: "https://www.settlesinaustralia.com.au/", required: false },
      { id: "electoral", label: "Enrol to vote when eligible (permanent residents & citizens)", link: "https://www.aec.gov.au/Enrolling_to_vote/", required: false },
    ],
  },
]

export function NewArrivalForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    visaType: "",
    arrivalDate: "",
    nsw_suburb: "",
    hasTFN: "",
    hasMedicare: "",
    hasDriverLicence: "",
    checklist: {} as Record<string, boolean>,
  })

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const STEPS = ["Your Arrival Info", "Essential Checklist", "Local Services"]

  const allItems = ESSENTIALS.flatMap((g) => g.items)
  const completedCount = allItems.filter((item) => form.checklist[item.id]).length

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, checklist: { ...prev.checklist, [name]: checked } }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    const formSummary = `
Nationality: ${form.nationality || "Not provided"}
Visa type: ${form.visaType || "Not provided"}
Arrival date: ${form.arrivalDate || "Not provided"}
NSW suburb: ${form.nsw_suburb || "Not provided"}
Checklist progress: ${completedCount}/${allItems.length} items done
    `.trim()
    const prompt = `User question about settling in NSW as a new arrival: ${chatInput}\n\nContext:\n${formSummary}`
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])
    setChatLoading(true)
    try {
      const reply = await sendMessageToApi(prompt, "new-arrival", userId)
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
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">New Arrival to NSW</h2>
            <p className="text-sm text-muted-foreground">Your guide to settling in New South Wales</p>
          </div>
        </div>
        <div className="ml-auto">
          <Badge variant="outline">{completedCount}/{allItems.length} steps done</Badge>
        </div>
      </div>

      {submitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Profile Saved!</h3>
                <p className="text-sm text-green-700">Your arrival profile has been saved. Use the chat assistant for personalised guidance.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <div className="flex gap-1 mb-2">
              {STEPS.map((label, i) => (
                <button key={i} type="button" onClick={() => setStep(i + 1)}
                  className={`flex-1 h-2 rounded-full transition-colors ${step === i + 1 ? "bg-secondary" : step > i + 1 ? "bg-secondary/40" : "bg-muted"}`}
                  title={label} />
              ))}
            </div>
            <CardTitle className="text-base">Step {step}: {STEPS[step - 1]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-4 rounded text-sm text-blue-900">
                    Welcome to NSW! Fill in your details so we can give you the most relevant guidance for your situation.
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <Input name="fullName" value={form.fullName} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input name="email" type="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input name="phone" type="tel" value={form.phone} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Country of Origin</Label>
                    <Input name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g. India, UK, Vietnam" />
                  </div>
                  <div>
                    <Label>Visa Type</Label>
                    <select name="visaType" value={form.visaType} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                      <option value="">Select your visa…</option>
                      {VISA_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Date of Arrival in Australia</Label>
                    <Input name="arrivalDate" type="date" value={form.arrivalDate} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>NSW Suburb / Postcode</Label>
                    <Input name="nsw_suburb" value={form.nsw_suburb} onChange={handleChange} placeholder="e.g. Parramatta 2150" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Do you already have a Tax File Number (TFN)?</Label>
                    <div className="flex gap-6">
                      {["Yes", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="hasTFN" value={opt} checked={form.hasTFN === opt} onChange={handleChange} />{opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Are you enrolled in Medicare?</Label>
                    <div className="flex gap-6">
                      {["Yes", "No", "Not eligible"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="hasMedicare" value={opt} checked={form.hasMedicare === opt} onChange={handleChange} />{opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Do you have an overseas driver licence?</Label>
                    <div className="flex gap-6">
                      {["Yes", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="hasDriverLicence" value={opt} checked={form.hasDriverLicence === opt} onChange={handleChange} />{opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setStep(2)}>Next →</Button>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">Work through these essential tasks. Click links to complete them on official government websites.</p>
                  {ESSENTIALS.map((group) => (
                    <div key={group.category}>
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{group.category}</h3>
                      <div className="space-y-2">
                        {group.items.map((item) => {
                          // Skip items already done based on form state
                          const preChecked =
                            (item.id === "tfn" && form.hasTFN === "Yes") ||
                            (item.id === "medicare" && form.hasMedicare === "Yes")
                          return (
                            <label key={item.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${(form.checklist[item.id] || preChecked) ? "border-green-300 bg-green-50" : "border-border hover:bg-muted/30"}`}>
                              <input type="checkbox" name={item.id} checked={!!(form.checklist[item.id] || preChecked)} onChange={handleChange} className="mt-0.5" readOnly={preChecked} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  {item.label}
                                  {item.required && <Badge className="text-xs bg-red-100 text-red-700">Priority</Badge>}
                                </div>
                                {item.link && (
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                    Official website <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              {(form.checklist[item.id] || preChecked) && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>← Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setStep(3)}>Next →</Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Useful NSW Local Services</h3>
                    {[
                      { name: "Service NSW", desc: "Licences, registrations, vouchers", url: "https://www.service.nsw.gov.au/" },
                      { name: "Settlement Services International (SSI)", desc: "Settlement support for refugees and migrants", url: "https://www.ssi.org.au/" },
                      { name: "TAFE NSW", desc: "English language, vocational training", url: "https://www.tafensw.edu.au/" },
                      { name: "Services Australia", desc: "Centrelink, Medicare, Child Support", url: "https://www.servicesaustralia.gov.au/" },
                      { name: "Fair Work Ombudsman", desc: "Know your workplace rights", url: "https://www.fairwork.gov.au/" },
                      { name: "NSW Health", desc: "Public hospitals, mental health", url: "https://www.health.nsw.gov.au/" },
                      { name: "Transport NSW (Opal)", desc: "Set up Opal card for public transport", url: "https://www.opal.com.au/" },
                      { name: "Community Legal Centres NSW", desc: "Free legal advice", url: "https://www.clcnsw.org.au/" },
                    ].map((s) => (
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded border hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.desc}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>← Back</Button>
                    <Button className="flex-1" onClick={() => setSubmitted(true)} disabled={submitted}>
                      {submitted ? "Saved ✓" : "Save My Profile"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat assistant */}
        <div className="sticky top-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-secondary" />
                Arrival Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50 rounded mb-2">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ask about visas, settling in NSW, working rights, Medicare, or anything you need help with…</p>
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
