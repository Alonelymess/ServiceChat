export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-primary text-primary-foreground rounded-lg p-8 mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4 text-balance">About ServiceChat</h1>
            <p className="text-xl max-w-2xl mx-auto text-pretty">
              Your intelligent assistant for navigating NSW government services with confidence and ease.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">What We Do</h2>
              <p className="text-muted-foreground leading-relaxed">
                ServiceChat is an AI-powered assistant designed to simplify your interactions with NSW government
                services. We understand that navigating government processes can be complex and time-consuming. Our
                intelligent system guides you through each step, provides personalized roadmaps, and helps you complete
                forms accurately.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Choose Your Scenario</h3>
                      <p className="text-muted-foreground text-sm">
                        Select from common NSW service scenarios or describe your unique situation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Answer Questions</h3>
                      <p className="text-muted-foreground text-sm">
                        Our AI asks relevant questions to understand your specific needs and circumstances.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Get Your Roadmap</h3>
                      <p className="text-muted-foreground text-sm">
                        Receive a personalized step-by-step plan with time estimates and priority levels.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Complete Tasks</h3>
                      <p className="text-muted-foreground text-sm">
                        Follow guided instructions, get form assistance, and track your progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Key Features</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Smart Roadmaps</h3>
                  <p className="text-muted-foreground text-sm">
                    Personalized step-by-step plans tailored to your specific situation and needs.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Form Assistance</h3>
                  <p className="text-muted-foreground text-sm">
                    AI-guided form filling with auto-completion and field-by-field guidance.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Location Services</h3>
                  <p className="text-muted-foreground text-sm">
                    Find nearby ServiceNSW centers with directions and real-time information.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Powered by AI</h2>
              <p className="text-muted-foreground leading-relaxed">
                ServiceChat uses advanced artificial intelligence to understand your unique situation and provide
                tailored guidance. Our system learns from thousands of NSW service interactions to offer the most
                relevant and up-to-date information, ensuring you get the help you need efficiently and accurately.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
