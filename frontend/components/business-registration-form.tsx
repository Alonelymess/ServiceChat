"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sendMessageToApi } from "@/lib/api"
import { ArrowLeft, Bot, CheckCircle2, XCircle, Briefcase, ExternalLink } from "lucide-react"

const BUSINESS_STRUCTURES = [
  { value: "sole_trader", label: "Sole Trader", desc: "You operate alone and are personally liable." },
  { value: "partnership", label: "Partnership", desc: "Two or more people share ownership and liability." },
  { value: "company", label: "Company (Pty Ltd)", desc: "Separate legal entity, limited liability." },
  { value: "trust", label: "Trust", desc: "Assets held by a trustee on behalf of beneficiaries." },
]

const INDUSTRY_LICENCES: Record<string, string[]> = {
  food: ["Food business registration (Council)", "Food safety supervisor certificate"],
  construction: ["Builder's licence (NSW Fair Trading)", "Home Building Compensation Fund"],
  transport: ["Heavy vehicle licence", "Taxi/rideshare accreditation"],
  childcare: ["Working with Children Check", "ACECQA service approval"],
  real_estate: ["Real estate agent licence (NSW Fair Trading)"],
  health: ["AHPRA registration", "Medicare provider number"],
}

const CHECKLIST_ITEMS = [
  { id: "abn", label: "Apply for ABN (Australian Business Number)", link: "https://www.abr.gov.au/business-super-funds-charities/applying-abn", required: true },
  { id: "business_name", label: "Register business name with ASIC (if not trading as your own name)", link: "https://asic.gov.au/for-business/registering-a-business-name/", required: false },
  { id: "gst", label: "Register for GST (if turnover > $75,000/year)", link: "https://www.ato.gov.au/business/gst/registering-for-gst/", required: false },
  { id: "tfn", label: "Apply for business Tax File Number (TFN)", link: "https://www.ato.gov.au/individuals/tax-file-number/apply-for-a-tfn/businesses/", required: true },
  { id: "bank_account", label: "Open a separate business bank account", link: "", required: true },
  { id: "insurance", label: "Get appropriate business insurance (public liability, professional indemnity)", link: "", required: false },
  { id: "super", label: "Set up superannuation obligations for employees", link: "https://www.ato.gov.au/business/super-for-employers/", required: false },
  { id: "payg", label: "Register for PAYG withholding (if paying staff)", link: "https://www.ato.gov.au/business/payg-withholding/", required: false },
  { id: "payroll_tax", label: "Check NSW payroll tax obligations (wages > $1.2M)", link: "https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/payroll-tax", required: false },
]

export function BusinessRegistrationForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    phone: "",
    businessName: "",
    businessStructure: "",
    industry: "",
    tradingAddress: "",
    startDate: "",
    numberOfEmployees: "",
    expectedTurnover: "",
    onlineOnly: "",
    checklist: {} as Record<string, boolean>,
    declaration: false,
  })

  const [formStatus, setFormStatus] = useState<"draft" | "submitted" | "approved" | "declined">("draft")
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [step, setStep] = useState(1)

  const STEPS = ["Business Details", "Compliance Checklist", "Review & Submit"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    if (type === "checkbox") {
      if (name === "declaration") {
        setForm((prev) => ({ ...prev, declaration: checked }))
      } else {
        setForm((prev) => ({ ...prev, checklist: { ...prev.checklist, [name]: checked } }))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const completedCount = CHECKLIST_ITEMS.filter((item) => form.checklist[item.id]).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus("submitted")
    setTimeout(() => setFormStatus(Math.random() > 0.3 ? "approved" : "declined"), 2000)
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    const formSummary = `
Business name: ${form.businessName || "Not provided"}
Structure: ${form.businessStructure || "Not provided"}
Industry: ${form.industry || "Not provided"}
Trading address: ${form.tradingAddress || "Not provided"}
Expected turnover: ${form.expectedTurnover || "Not provided"}
Employees: ${form.numberOfEmployees || "Not provided"}
Checklist completed: ${completedCount}/${CHECKLIST_ITEMS.length} items
    `.trim()
    const prompt = `User question about NSW business registration: ${chatInput}\n\nCurrent form state:\n${formSummary}`
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])
    setChatLoading(true)
    try {
      const reply = await sendMessageToApi(prompt, "business-registration", userId)
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
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Business Registration</h2>
            <p className="text-sm text-muted-foreground">Set up your business in NSW</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">{completedCount}/{CHECKLIST_ITEMS.length} steps done</Badge>
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
                <p className="text-sm text-red-700 mb-3">Please complete all required fields and try again.</p>
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
                <h3 className="font-semibold text-green-800">Registration Lodged!</h3>
                <p className="text-sm text-green-700">Your business registration details have been submitted. Check your email for next steps.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            {/* Step progress */}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <Label>Your Full Name</Label>
                    <Input name="ownerName" value={form.ownerName} onChange={handleChange} required />
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
                    <Label>Proposed Business Name</Label>
                    <Input name="businessName" value={form.businessName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Business Structure</Label>
                    <div className="space-y-2 mt-1">
                      {BUSINESS_STRUCTURES.map((s) => (
                        <label key={s.value} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${form.businessStructure === s.value ? "border-secondary bg-secondary/5" : "border-border hover:bg-muted/30"}`}>
                          <input type="radio" name="businessStructure" value={s.value} checked={form.businessStructure === s.value} onChange={handleChange} className="mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{s.label}</div>
                            <div className="text-xs text-muted-foreground">{s.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Industry / Type of Business</Label>
                    <select name="industry" value={form.industry} onChange={handleChange} required className="w-full border rounded p-2 text-sm">
                      <option value="">Select industry…</option>
                      <option value="food">Food & Hospitality</option>
                      <option value="construction">Building & Construction</option>
                      <option value="transport">Transport & Logistics</option>
                      <option value="childcare">Childcare & Education</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="health">Health & Medical</option>
                      <option value="retail">Retail</option>
                      <option value="technology">Technology & IT</option>
                      <option value="other">Other</option>
                    </select>
                    {form.industry && INDUSTRY_LICENCES[form.industry] && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mt-2 rounded text-sm text-amber-900">
                        <strong>Licences required for your industry:</strong>
                        <ul className="mt-1 list-disc ml-4">
                          {INDUSTRY_LICENCES[form.industry].map((l) => <li key={l}>{l}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Trading Address (NSW)</Label>
                    <Input name="tradingAddress" value={form.tradingAddress} onChange={handleChange} required placeholder="Street address, suburb, postcode" />
                  </div>
                  <div>
                    <Label>Proposed Start Date</Label>
                    <Input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Number of Employees</Label>
                      <Input name="numberOfEmployees" value={form.numberOfEmployees} onChange={handleChange} placeholder="0 if sole trader" />
                    </div>
                    <div>
                      <Label>Expected Annual Turnover</Label>
                      <Input name="expectedTurnover" value={form.expectedTurnover} onChange={handleChange} placeholder="e.g. $80,000" />
                    </div>
                  </div>
                  <Button type="button" className="w-full" onClick={() => setStep(2)}>Next →</Button>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">Work through these registration requirements. Click external links to complete each step on the relevant government website.</p>
                  <div className="space-y-3">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label key={item.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${form.checklist[item.id] ? "border-green-300 bg-green-50" : "border-border hover:bg-muted/30"}`}>
                        <input type="checkbox" name={item.id} checked={!!form.checklist[item.id]} onChange={handleChange} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {item.label}
                            {item.required && <Badge className="text-xs bg-red-100 text-red-700">Required</Badge>}
                          </div>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                              Open official page <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {form.checklist[item.id] && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>← Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setStep(3)}>Next →</Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Business Name</span><span className="font-medium">{form.businessName || "—"}</span>
                      <span className="text-muted-foreground">Structure</span><span className="font-medium">{form.businessStructure || "—"}</span>
                      <span className="text-muted-foreground">Industry</span><span className="font-medium">{form.industry || "—"}</span>
                      <span className="text-muted-foreground">Trading Address</span><span className="font-medium">{form.tradingAddress || "—"}</span>
                      <span className="text-muted-foreground">Start Date</span><span className="font-medium">{form.startDate || "—"}</span>
                      <span className="text-muted-foreground">Checklist</span><span className="font-medium">{completedCount}/{CHECKLIST_ITEMS.length} completed</span>
                    </div>
                  </div>
                  <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-4 rounded text-sm text-blue-900">
                    By submitting, you acknowledge that the information provided is accurate. This is a Service NSW pre-registration record — individual registrations (ABN, business name, licences) must be completed through their respective agencies.
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="declaration" checked={form.declaration} onChange={handleChange} required className="mt-0.5" />
                    I confirm all information is true and correct.
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>← Back</Button>
                    <Button type="submit" className="flex-1" disabled={formStatus === "submitted"}>
                      {formStatus === "submitted" ? "Submitting…" : "Submit Registration"}
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
                Business Registration Help
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50 rounded mb-2">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ask about business structures, licences, taxes, or the registration process…</p>
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
