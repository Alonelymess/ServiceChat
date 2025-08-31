"use client"

import React, { useState } from "react"
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendMessageToApi } from "@/lib/api"
import { ArrowLeft, Camera, CheckCircle2, HelpCircle, AlertTriangle, Upload, XCircle, Bot } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function BirthRegistrationForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    bornInNSW: "",
    relationship: "",
    hasIdentityDocs: "",
    // Child
    childFullName: "",
    childDOB: "",
    childPlace: "",
    childSex: "",
    childBirthTimeHour: "",
    childBirthTimeMinute: "",
    childBirthWeight: "",
    // Parent 1
    parent1FullName: "",
    parent1DOB: "",
    parent1Place: "",
    parent1Address: "",
    parent1Contact: "",
    // Parent 2
    parent2FullName: "",
    parent2DOB: "",
    parent2Place: "",
    parent2Address: "",
    parent2Contact: "",
    // Other
    maritalStatus: "",
    siblings: "",
    aboriginal: "",
    aboriginalOrigin: "",
    assistedReproduction: "",
    declaration: false,
    // File uploads (not functional in this mockup)
    hospitalNotification: null,
    parentID: null,
    // Payment (not functional in this mockup)
    orderCertificate: false,
    paymentDetails: "",
    // Email fields
    email: "",
    confirmEmail: "",
    // New fields
    multipleBirth: "",
    bornInHospital: "",
    hospitalName: "",
    birthAddress: "",
    babyBundle: "",
  })
  const [showRest, setShowRest] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [formStatus, setFormStatus] = useState<"draft" | "submitted" | "declined" | "approved">("draft")
  const [declineReason, setDeclineReason] = useState("")
  const [needsHelp, setNeedsHelp] = useState<boolean | null>(null)
  const [showFormImage, setShowFormImage] = useState(true)
  const [uploadedForm, setUploadedForm] = useState<File | null>(null)

  // Info dictionary for contextually relevant information
  const infoContext: Record<string, string> = {
    bornInNSW_no: `If the birth was outside of NSW, you need to apply to the Registry office in that state or territory.\nFor births outside NSW, see the federal guide: https://www.servicesaustralia.gov.au/register-birth-your-baby?context=60001\nOr, click for interstate registries contact details: https://www.bdm.nsw.gov.au/Pages/births/interstate-registries.aspx`,
    hasIdentityDocs_no: `A range of identity documents are accepted for this application including a rates notice or utility bill. If you still don't have enough ID, a paper form can be submitted with other supporting documents. See: https://www.nsw.gov.au/family-and-relationships/births/register-your-baby`,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked, files } = e.target as any
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }))
    } else if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    if (name === "bornInNSW") {
      setShowRest(value === "yes")
    }
    // Reset dependent fields if bornInHospital changes
    if (name === "bornInHospital") {
      setForm((prev) => ({
        ...prev,
        hospitalName: "",
        birthAddress: "",
        babyBundle: ""
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Form submitted! (Demo only)")
  }

  function handleNoNSWClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    e.preventDefault();
    // const link = "https://www.servicesaustralia.gov.au/register-birth-your-baby?context=60001";
    // const prompt = `The user indicated their child was not born in NSW. Please provide guidance using this official link: ${link}`;
    // sendMessageToApi(prompt, "new-baby", userId);
    // window.open(link, '_blank', 'noopener,noreferrer');
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return;
    // Gather the whole form state, sending 'Not answer' for empty fields
    const formQAArray = Object.entries(form)
      .map(([key, value]) => {
        if (typeof value === 'boolean') return `${key}: ${value}`;
        if (typeof value === 'number') return `${key}: ${value}`;
        if (typeof value === 'string') return `${key}: ${value && value.trim() !== '' ? value : 'Not answer'}`;
        if (value === null || value === undefined) return `${key}: Not answer`;
        return `${key}: Not answer`;
      });
    const formQA = formQAArray.join('\n');
    // Get the last object from formQAArray with the answer not 'Not answer', excluding true/false fields
    const lastAnswered = (() => {
      for (let i = formQAArray.length - 1; i >= 0; i--) {
        const [k, v] = formQAArray[i].split(':');
        if (v && v.trim() !== 'Not answer' && v.trim() !== 'true' && v.trim() !== 'false') return formQAArray[i];
      }
      return null;
    })();
    // Collect relevant info context
    let extraInfo = '';
    if (form.bornInNSW === 'no') {
      extraInfo += `\n\n${infoContext.bornInNSW_no}`;
    }
    if (form.hasIdentityDocs === 'no') {
      extraInfo += `\n\n${infoContext.hasIdentityDocs_no}`;
    }
    const prompt = `User question about birth registration form: ${chatInput}\nCurrent QA: ${lastAnswered}\n\nCurrent form answers:\n${formQA}${extraInfo}`;
    setChatMessages((prev) => [...prev, { role: 'user', content: chatInput }])
    setChatLoading(true)
    try {
      const botReply = await sendMessageToApi(
        prompt,
        "new-baby",
        userId
      )
      setChatMessages((prev) => [
        ...prev,
        { role: 'bot', content: typeof botReply === "string" ? botReply : JSON.stringify(botReply) }
      ])
    } catch {
      setChatMessages((prev) => [...prev, { role: 'bot', content: "Sorry, I couldn't get an answer right now." }])
    }
    setChatInput("")
    setChatLoading(false)
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
    setTimeout(() => {
      const isApproved = Math.random() > 0.3
      if (isApproved) {
        setFormStatus("approved")
      } else {
        setFormStatus("declined")
        setDeclineReason(
          "Missing required documentation. Please ensure all fields are completed accurately and upload supporting documents."
        )
      }
    }, 2000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.location.assign("/")}
          className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Main Page
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Birth Registration Form</h2>
            <p className="text-sm text-muted-foreground">Register a new birth in NSW</p>
          </div>
        </div>
        <div className="ml-auto">
          {formStatus === "submitted" && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing...</Badge>
          )}
          {formStatus === "approved" && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
          )}
          {formStatus === "declined" && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">Declined</Badge>
          )}
        </div>
      </div>
      {formStatus === "declined" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Form Declined</h3>
                <p className="text-sm text-red-700 mb-4">{declineReason}</p>
                <div className="flex gap-2">
                  <Button onClick={() => { setFormStatus("draft"); setDeclineReason("") }} size="sm">Fix Issues & Resubmit</Button>
                  <Button variant="outline" onClick={() => window.location.assign("/service-scenarios")} size="sm" className="bg-transparent">Review Chat History</Button>
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
      {/* Remove Form Preview, use only the form and side chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>NSW Birth Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Was the child born in NSW? */}
                <div>
                  <Label className="block mb-2">Was the child born in NSW?</Label>
                  <div className="flex gap-6 mb-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="bornInNSW" value="yes" checked={form.bornInNSW === "yes"} onChange={handleChange} required />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="bornInNSW" value="no" checked={form.bornInNSW === "no"} onChange={handleChange} required />
                      No
                    </label>
                  </div>
                  {form.bornInNSW === "no" && (
                    <div className="bg-muted p-4 rounded border-l-4 border-blue-400 flex gap-2 items-start">
                      <span className="text-blue-600 font-bold">i</span>
                      <span>
                        If the birth was outside of NSW, you need to apply to the Registry office in that state or territory. <br />
                        For births outside NSW, see the federal guide: <a href="https://www.servicesaustralia.gov.au/register-birth-your-baby?context=60001" target="_blank" rel="noopener noreferrer" className="underline text-blue-700" onClick={handleNoNSWClick}>Register birth of your baby (Services Australia)</a>.<br />
                        Or, click for <a href="https://www.bdm.nsw.gov.au/Pages/births/interstate-registries.aspx" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">interstate registries</a> contact details.
                      </span>
                    </div>
                  )}
                </div>
                {/* Only show next two questions if Yes */}
                {form.bornInNSW === "yes" && (
                  <>
                    {/* Relationship to child */}
                    <div>
                      <Label className="block mb-2">What is your relationship to the child?</Label>
                      <select name="relationship" value={form.relationship} onChange={handleChange} required className="w-full border rounded p-2">
                        <option value="">Select</option>
                        <option value="mother">Mother</option>
                        <option value="father">Father</option>
                        <option value="parent">Parent</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {/* Identity documents */}
                    <div>
                      <Label className="block mb-2">Do you have 3 forms of valid identity documents for each parent to prove their identity?</Label>
                      <div className="flex gap-6 mb-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="hasIdentityDocs" value="yes" checked={form.hasIdentityDocs === "yes"} onChange={handleChange} required />
                          Yes
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="hasIdentityDocs" value="no" checked={form.hasIdentityDocs === "no"} onChange={handleChange} required />
                          No
                        </label>
                      </div>
                      {form.hasIdentityDocs === "no" && (
                        <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-6 rounded flex gap-3 items-start mt-4">
                          <span className="inline-block mt-1 text-blue-700 bg-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg border border-blue-200">i</span>
                          <div>
                            <div className="font-semibold text-base mb-1 text-blue-900">Don't have enough identity documents?</div>
                            <div className="text-sm text-blue-900">A range of identity documents are accepted for this application including a rates notice or utility bill. If you still don't have enough ID, a paper form can be submitted with other supporting documents. Visit <a href="https://www.nsw.gov.au/family-and-relationships/births/register-your-baby" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-purple-800 hover:text-purple-900 focus:outline focus:ring-2 focus:ring-purple-600">Register your baby</a> for information on identity documents and an alternative application process.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* Only show the rest of the form if hasIdentityDocs is yes */}
                {form.bornInNSW === "yes" && form.hasIdentityDocs === "yes" && (
                  <>
                    {/* Was more than one child born? */}
                    <div>
                      <Label className="block mb-2">Was more than one child born?</Label>
                      <div className="text-xs text-muted-foreground mb-2">For example twins or triplets.</div>
                      <div className="flex gap-6 mb-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="multipleBirth" value="yes" checked={form.multipleBirth === "yes"} onChange={handleChange} />
                          Yes
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="multipleBirth" value="no" checked={form.multipleBirth === "no"} onChange={handleChange} />
                          No
                        </label>
                      </div>
                    </div>
                    {/* Location of birth */}
                    <div>
                      <h3 className="font-semibold text-2xl mb-2">Location of birth</h3>
                      <Label className="block mb-2">Was the child born in hospital?</Label>
                      <div className="flex gap-6 mb-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="bornInHospital" value="yes" checked={form.bornInHospital === "yes"} onChange={handleChange} />
                          Yes
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="bornInHospital" value="no" checked={form.bornInHospital === "no"} onChange={handleChange} />
                          No
                        </label>
                      </div>
                      {/* Conditional fields for hospital birth */}
                      {form.bornInHospital === "yes" && (
                        <div className="mb-4">
                          <Label>Hospital name</Label>
                          <Input name="hospitalName" value={form.hospitalName || ''} onChange={handleChange} required />
                        </div>
                      )}
                      {form.bornInHospital === "no" && (
                        <div className="mb-4 space-y-2">
                          <Label>Address</Label>
                          <Input name="birthAddress" value={form.birthAddress || ''} onChange={handleChange} required />
                          <Label className="block mt-4 mb-1">Would you like a baby bundle delivered?</Label>
                          <div className="flex gap-6 mb-2">
                            <label className="flex items-center gap-2">
                              <input type="radio" name="babyBundle" value="yes" checked={form.babyBundle === "yes"} onChange={handleChange} />
                              Yes
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" name="babyBundle" value="no" checked={form.babyBundle === "no"} onChange={handleChange} />
                              No
                            </label>
                          </div>
                          {form.babyBundle === "yes" && (
                            <div className="text-xs text-blue-700 bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                              Note: If selected, your information will be provided to a third party in order for your baby bundle to be delivered.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Email Address Section (matches screenshot) */}
                    <div>
                      <h3 className="font-semibold text-2xl mb-2">Your email address</h3>
                      <div className="bg-[#e9ecf3] border-l-4 border-blue-400 p-6 rounded flex gap-3 items-start mb-4">
                        <span className="inline-block mt-1 text-blue-700 bg-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg border border-blue-200">i</span>
                        <div className="text-blue-900">Enter your personal email address. Use this same email across all of your applications.</div>
                      </div>
                      <Label className="font-semibold">Email address</Label>
                      <Input name="email" value={form.email || ''} onChange={handleChange} required />
                      <Label className="font-semibold mt-4">Confirm email</Label>
                      <Input name="confirmEmail" value={form.confirmEmail || ''} onChange={handleChange} required />
                      <div className="text-sm text-muted-foreground mt-2">You will receive an email with a unique Online Reference Number (ORN). Your responses will be automatically saved and you can use this ORN to resume your application anytime within 14 days of starting your application.</div>
                    </div>
                    {/* Child's Details */}
                    <div>
                      <h3 className="font-semibold mb-2">Child's Details</h3>
                      <Label>Full Name</Label>
                      <Input name="childFullName" value={form.childFullName} onChange={handleChange} required />
                      <Label>Date of Birth</Label>
                      <Input name="childDOB" type="date" value={form.childDOB} onChange={handleChange} required />
                      <Label>Place of Birth</Label>
                      <Input name="childPlace" value={form.childPlace} onChange={handleChange} required />
                      <Label>Sex</Label>
                      <Input name="childSex" value={form.childSex} onChange={handleChange} required />
                      {/* Time of birth */}
                      <Label className="mt-4">Time of birth</Label>
                      <div className="flex gap-4 items-end">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Hour</div>
                          <Input name="childBirthTimeHour" type="number" min="0" max="23" value={form.childBirthTimeHour} onChange={handleChange} placeholder="HH" className="w-20" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Minute</div>
                          <Input name="childBirthTimeMinute" type="number" min="0" max="59" value={form.childBirthTimeMinute} onChange={handleChange} placeholder="MM" className="w-20" />
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 ml-2">Enter in 24 hour time format, for example 21:30</div>
                      </div>
                      {/* Weight at birth */}
                      <Label className="mt-4">Child's weight at birth</Label>
                      <div className="text-xs text-muted-foreground mb-1">Enter the weight in grams. This can be found in the blue book.</div>
                      <Input name="childBirthWeight" value={form.childBirthWeight} onChange={handleChange} placeholder="e.g. 3200" />
                    </div>
                    {/* Parent 1 Details */}
                    <div>
                      <h3 className="font-semibold mb-2">Parent 1 Details</h3>
                      <Label>Full Name</Label>
                      <Input name="parent1FullName" value={form.parent1FullName} onChange={handleChange} required />
                      <Label>Date of Birth</Label>
                      <Input name="parent1DOB" type="date" value={form.parent1DOB} onChange={handleChange} required />
                      <Label>Place of Birth</Label>
                      <Input name="parent1Place" value={form.parent1Place} onChange={handleChange} required />
                      <Label>Address</Label>
                      <Input name="parent1Address" value={form.parent1Address} onChange={handleChange} required />
                      <Label>Contact Details</Label>
                      <Input name="parent1Contact" value={form.parent1Contact} onChange={handleChange} required />
                    </div>
                    {/* Parent 2 Details */}
                    <div>
                      <h3 className="font-semibold mb-2">Parent 2 Details (if applicable)</h3>
                      <Label>Full Name</Label>
                      <Input name="parent2FullName" value={form.parent2FullName} onChange={handleChange} />
                      <Label>Date of Birth</Label>
                      <Input name="parent2DOB" type="date" value={form.parent2DOB} onChange={handleChange} />
                      <Label>Place of Birth</Label>
                      <Input name="parent2Place" value={form.parent2Place} onChange={handleChange} />
                      <Label>Address</Label>
                      <Input name="parent2Address" value={form.parent2Address} onChange={handleChange} />
                      <Label>Contact Details</Label>
                      <Input name="parent2Contact" value={form.parent2Contact} onChange={handleChange} />
                    </div>
                    {/* Additional Details */}
                    <div>
                      <h3 className="font-semibold mb-2">Additional Details</h3>
                      <Label>Marital Status of Parents</Label>
                      <Input name="maritalStatus" value={form.maritalStatus} onChange={handleChange} />
                      <Label>Other Children (Siblings)</Label>
                      <Input name="siblings" value={form.siblings} onChange={handleChange} />
                      <Label>Aboriginal or Torres Strait Islander origin</Label>
                      <Input name="aboriginal" value={form.aboriginal} onChange={handleChange} />
                      {/* Aboriginal or Torres Strait Islander origin */}
                      <div>
                        <Label>Is the child of Aboriginal and/or Torres Strait Islander origin?</Label>
                        <select name="aboriginalOrigin" value={form.aboriginalOrigin} onChange={handleChange} className="w-full border rounded p-2">
                          <option value="">Select</option>
                          <option value="No">No</option>
                          <option value="Aboriginal">Aboriginal</option>
                          <option value="Torres Strait Islander">Torres Strait Islander</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      {/* Assisted reproduction */}
                      <div>
                        <Label>Was the child conceived through assisted reproductive technology using a donated sperm or ovum (egg)? (optional)</Label>
                        <div className="flex gap-6 mt-2">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="assistedReproduction" value="yes" checked={form.assistedReproduction === "yes"} onChange={handleChange} />
                            Yes <span className="text-xs text-muted-foreground">(Note: If selected, the child will be notified of potential additional information availability if obtaining a birth certificate after age 18, as per the Assisted Reproductive Technology Act 2007)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="assistedReproduction" value="no" checked={form.assistedReproduction === "no"} onChange={handleChange} />
                            No
                          </label>
                        </div>
                      </div>
                    </div>
                    {/* Declaration */}
                    <div>
                      <Label>
                        <input type="checkbox" name="declaration" checked={form.declaration} onChange={handleChange} required /> I confirm all information is true and correct
                      </Label>
                    </div>
                    {/* Supporting Documents */}
                    <div>
                      <h3 className="font-semibold mb-2">Supporting Documents</h3>
                      <Label>Upload Hospital Birth Notification</Label>
                      <Input name="hospitalNotification" type="file" onChange={handleChange} />
                      <Label>Upload Proof of Identity for Parents</Label>
                      <Input name="parentID" type="file" onChange={handleChange} />
                    </div>
                    {/* Payment */}
                    <div>
                      <h3 className="font-semibold mb-2">Order Birth Certificate (Optional)</h3>
                      <Label>
                        <input type="checkbox" name="orderCertificate" checked={form.orderCertificate} onChange={handleChange} /> Order a birth certificate (fee applies)
                      </Label>
                      <Label>Payment Details</Label>
                      <Input name="paymentDetails" value={form.paymentDetails} onChange={handleChange} />
                    </div>
                    <Button type="submit" className="w-full mt-4">Submit Registration</Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Side Chat Window always open */}
        <div>
          <div className="sticky top-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-secondary" />
                  Form Help Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50 rounded">
                  {chatMessages.length === 0 && <div className="text-sm text-muted-foreground">Ask a question about this form…</div>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`text-sm p-2 rounded-lg break-words max-w-full ${msg.role === 'user' ? 'bg-blue-200 text-right ml-8' : 'bg-white mr-8 border'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ))}
                  {chatLoading && <div className="text-xs text-blue-600">Assistant is typing…</div>}
                </div>
                <form
                  className="p-2 border-t flex gap-2"
                  onSubmit={e => { e.preventDefault(); handleChatSend(); }}
                >
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="Type your question…"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <Button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50" disabled={chatLoading || !chatInput.trim()}>Send</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


