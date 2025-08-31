"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Clock, Phone, Navigation, ExternalLink, Search } from "lucide-react"

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

interface ServiceLocation {
  id: string
  name: string
  address: string
  suburb: string
  postcode: string
  phone: string
  distance: number
  openingHours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  services: string[]
  waitTime: string
  coordinates: { lat: number; lng: number }
}

interface LocationFinderProps {
  step: RoadmapStep
  userLocation: { lat: number; lng: number } | null
  onBack: () => void
}

// Mock service locations data
const getServiceLocations = (
  stepLocation: string,
  userLocation: { lat: number; lng: number } | null,
): ServiceLocation[] => {
  const mockLocations: Record<string, ServiceLocation[]> = {
    "Service NSW Centre": [
      {
        id: "sydney-cbd",
        name: "Service NSW Sydney CBD",
        address: "Level 1, 2-24 Rawson Place",
        suburb: "Sydney",
        postcode: "2000",
        phone: "13 77 88",
        distance: userLocation ? 2.3 : 0,
        openingHours: {
          monday: "8:30am - 5:00pm",
          tuesday: "8:30am - 5:00pm",
          wednesday: "8:30am - 5:00pm",
          thursday: "8:30am - 5:00pm",
          friday: "8:30am - 5:00pm",
          saturday: "9:00am - 4:00pm",
          sunday: "Closed",
        },
        services: ["Driver License", "Vehicle Registration", "Birth Certificates", "Working with Children Check"],
        waitTime: "15-30 minutes",
        coordinates: { lat: -33.8688, lng: 151.2093 },
      },
      {
        id: "parramatta",
        name: "Service NSW Parramatta",
        address: "Ground Floor, 255 Church Street",
        suburb: "Parramatta",
        postcode: "2150",
        phone: "13 77 88",
        distance: userLocation ? 5.7 : 0,
        openingHours: {
          monday: "8:30am - 5:00pm",
          tuesday: "8:30am - 5:00pm",
          wednesday: "8:30am - 5:00pm",
          thursday: "8:30am - 5:00pm",
          friday: "8:30am - 5:00pm",
          saturday: "9:00am - 4:00pm",
          sunday: "Closed",
        },
        services: ["Driver License", "Vehicle Registration", "Birth Certificates", "Business Registration"],
        waitTime: "20-35 minutes",
        coordinates: { lat: -33.815, lng: 151.0 },
      },
      {
        id: "bondi-junction",
        name: "Service NSW Bondi Junction",
        address: "Level 1, 500 Oxford Street",
        suburb: "Bondi Junction",
        postcode: "2022",
        phone: "13 77 88",
        distance: userLocation ? 8.1 : 0,
        openingHours: {
          monday: "8:30am - 5:00pm",
          tuesday: "8:30am - 5:00pm",
          wednesday: "8:30am - 5:00pm",
          thursday: "8:30am - 5:00pm",
          friday: "8:30am - 5:00pm",
          saturday: "9:00am - 4:00pm",
          sunday: "Closed",
        },
        services: ["Driver License", "Vehicle Registration", "Birth Certificates"],
        waitTime: "10-25 minutes",
        coordinates: { lat: -33.8915, lng: 151.2477 },
      },
    ],
    "Medicare Service Centre": [
      {
        id: "medicare-sydney",
        name: "Medicare Service Centre Sydney",
        address: "Level 2, 388 George Street",
        suburb: "Sydney",
        postcode: "2000",
        phone: "132 011",
        distance: userLocation ? 1.8 : 0,
        openingHours: {
          monday: "8:30am - 4:30pm",
          tuesday: "8:30am - 4:30pm",
          wednesday: "8:30am - 4:30pm",
          thursday: "8:30am - 4:30pm",
          friday: "8:30am - 4:30pm",
          saturday: "Closed",
          sunday: "Closed",
        },
        services: ["Medicare Enrollment", "Medicare Card Replacement", "Newborn Enrollment"],
        waitTime: "25-40 minutes",
        coordinates: { lat: -33.8688, lng: 151.2073 },
      },
      {
        id: "medicare-parramatta",
        name: "Medicare Service Centre Parramatta",
        address: "Shop 4019, Level 4, Westfield Parramatta",
        suburb: "Parramatta",
        postcode: "2150",
        phone: "132 011",
        distance: userLocation ? 6.2 : 0,
        openingHours: {
          monday: "9:00am - 5:30pm",
          tuesday: "9:00am - 5:30pm",
          wednesday: "9:00am - 5:30pm",
          thursday: "9:00am - 9:00pm",
          friday: "9:00am - 5:30pm",
          saturday: "9:00am - 5:00pm",
          sunday: "10:00am - 4:00pm",
        },
        services: ["Medicare Enrollment", "Medicare Card Replacement", "Newborn Enrollment"],
        waitTime: "30-45 minutes",
        coordinates: { lat: -33.815, lng: 151.002 },
      },
    ],
    "Bank Branch": [
      {
        id: "cba-sydney",
        name: "Commonwealth Bank Sydney CBD",
        address: "341 George Street",
        suburb: "Sydney",
        postcode: "2000",
        phone: "13 2221",
        distance: userLocation ? 1.5 : 0,
        openingHours: {
          monday: "9:30am - 4:00pm",
          tuesday: "9:30am - 4:00pm",
          wednesday: "9:30am - 4:00pm",
          thursday: "9:30am - 5:00pm",
          friday: "9:30am - 4:00pm",
          saturday: "Closed",
          sunday: "Closed",
        },
        services: ["Account Opening", "Home Loans", "Business Banking", "International Services"],
        waitTime: "15-30 minutes",
        coordinates: { lat: -33.8688, lng: 151.2063 },
      },
      {
        id: "anz-sydney",
        name: "ANZ Sydney CBD",
        address: "20 Martin Place",
        suburb: "Sydney",
        postcode: "2000",
        phone: "13 1314",
        distance: userLocation ? 2.1 : 0,
        openingHours: {
          monday: "9:30am - 4:00pm",
          tuesday: "9:30am - 4:00pm",
          wednesday: "9:30am - 4:00pm",
          thursday: "9:30am - 5:00pm",
          friday: "9:30am - 4:00pm",
          saturday: "Closed",
          sunday: "Closed",
        },
        services: ["Account Opening", "Home Loans", "Business Banking", "International Services"],
        waitTime: "20-35 minutes",
        coordinates: { lat: -33.8688, lng: 151.2103 },
      },
    ],
  }

  return mockLocations[stepLocation] || []
}

export function LocationFinder({ step, userLocation, onBack }: LocationFinderProps) {
  const [locations, setLocations] = useState<ServiceLocation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null)

  useEffect(() => {
    if (step.location) {
      const serviceLocations = getServiceLocations(step.location, userLocation)
      // Sort by distance if user location is available
      if (userLocation) {
        serviceLocations.sort((a, b) => a.distance - b.distance)
      }
      setLocations(serviceLocations)
    }
  }, [step.location, userLocation])

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const openInMaps = (location: ServiceLocation) => {
    const query = encodeURIComponent(`${location.name}, ${location.address}, ${location.suburb}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
  }

  const getCurrentDay = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()] as keyof ServiceLocation["openingHours"]
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Find Nearby Locations</h2>
            <p className="text-sm text-muted-foreground">
              {step.title} - {step.location}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Interactive Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Interactive Map</h3>
                  <p className="text-muted-foreground mb-4">
                    Map showing nearby {step.location?.toLowerCase()} locations would appear here
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {filteredLocations.slice(0, 4).map((location) => (
                      <div key={location.id} className="p-2 bg-white rounded border text-left">
                        <div className="font-medium text-xs">{location.name}</div>
                        <div className="text-muted-foreground text-xs">{location.suburb}</div>
                        {userLocation && <div className="text-secondary text-xs">{location.distance}km away</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="search">Search by name or suburb</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search locations..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Found {filteredLocations.length} {step.location?.toLowerCase()} locations
                  {userLocation && " near you"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{location.name}</h3>
                        <p className="text-xs text-muted-foreground">{location.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.suburb} {location.postcode}
                        </p>
                      </div>
                      {userLocation && (
                        <Badge variant="secondary" className="text-xs">
                          {location.distance}km
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{location.openingHours[getCurrentDay()]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{location.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Wait time: </span>
                        <span className="font-medium">{location.waitTime}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInMaps(location)}
                          className="text-xs h-7 bg-transparent"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Directions
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLocation(location)}
                          className="text-xs h-7"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Location Details Modal */}
      {selectedLocation && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedLocation.name}
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedLocation(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Address</h4>
              <p className="text-sm text-muted-foreground">
                {selectedLocation.address}
                <br />
                {selectedLocation.suburb} {selectedLocation.postcode}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Contact</h4>
              <p className="text-sm text-muted-foreground">Phone: {selectedLocation.phone}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Opening Hours</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(selectedLocation.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{day}:</span>
                    <span className={day === getCurrentDay() ? "font-medium" : ""}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Services Available</h4>
              <div className="flex flex-wrap gap-1">
                {selectedLocation.services.map((service) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => openInMaps(selectedLocation)} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline" onClick={() => setSelectedLocation(null)} className="bg-transparent">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
