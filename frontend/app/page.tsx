import { ServiceScenarios } from "@/components/service-scenarios"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-[#1976d2] text-white py-12 mb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 text-balance">Need help with government services?</h1>
            <p className="text-xl max-w-2xl mx-auto text-pretty">
            Get clear guidance and a roadmap designed just for you.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Service Scenarios */}
          <ServiceScenarios />
        </div>
      </div>
    </main>
  )
}
