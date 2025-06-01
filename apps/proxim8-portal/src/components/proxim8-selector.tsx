"use client"

import { useState } from "react"
import { X, Shield, Zap, Brain, Users, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/timeline-data"

interface Proxim8 {
  id: string
  name: string
  personality: "analytical" | "aggressive" | "diplomatic"
  level: number
  experience: number
  successRate: number
  specialization: "sabotage" | "expose" | "organize" | null
  missionCount: number
}

interface Proxim8SelectorProps {
  event: TimelineEvent
  proxim8s: Proxim8[]
  onClose: () => void
  onDeploy: (eventId: string, approach: string, proxim8Id: string) => void
  selectedApproach: string
}

export default function Proxim8Selector({
  event,
  proxim8s,
  onClose,
  onDeploy,
  selectedApproach,
}: Proxim8SelectorProps) {
  const [selectedProxim8, setSelectedProxim8] = useState<string | null>(null)

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case "analytical":
        return <Brain className="h-4 w-4 text-blue-400" />
      case "aggressive":
        return <Zap className="h-4 w-4 text-red-400" />
      case "diplomatic":
        return <Users className="h-4 w-4 text-green-400" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case "analytical":
        return "border-blue-500 bg-blue-950/20"
      case "aggressive":
        return "border-red-500 bg-red-950/20"
      case "diplomatic":
        return "border-green-500 bg-green-950/20"
      default:
        return "border-gray-700 bg-gray-900"
    }
  }

  const getMissionCompatibility = (proxim8: Proxim8) => {
    // Match personality to approach
    if (
      (proxim8.personality === "analytical" && selectedApproach === "expose") ||
      (proxim8.personality === "aggressive" && selectedApproach === "sabotage") ||
      (proxim8.personality === "diplomatic" && selectedApproach === "organize") ||
      proxim8.specialization === selectedApproach
    ) {
      return {
        compatible: true,
        bonus: "High compatibility (+15% success chance)",
        icon: <CheckCircle className="h-4 w-4 text-green-400" />,
        className: "text-green-400",
      }
    } else if (
      (proxim8.personality === "analytical" && selectedApproach === "sabotage") ||
      (proxim8.personality === "aggressive" && selectedApproach === "organize")
    ) {
      return {
        compatible: false,
        bonus: "Low compatibility (-10% success chance)",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
        className: "text-yellow-400",
      }
    } else {
      return {
        compatible: true,
        bonus: "Compatible",
        icon: <Info className="h-4 w-4 text-blue-400" />,
        className: "text-blue-400",
      }
    }
  }

  const handleDeploy = () => {
    if (selectedProxim8) {
      onDeploy(event.id, selectedApproach, selectedProxim8)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="outline" className="mb-2 bg-transparent">
                {event.date}
              </Badge>
              <CardTitle className="text-xl">Select Proxim8 for Mission</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{event.title}</h3>
            <p className="text-sm text-gray-300 mb-4">{event.description}</p>

            <div className="bg-gray-800 p-3 rounded-md mb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-900/20 text-yellow-400">{selectedApproach.toUpperCase()}</Badge>
                <span className="text-sm">Approach Selected</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {selectedApproach === "sabotage"
                  ? `Hack ${event.title.split(" ")[0]}'s demonstration systems during the public hearing`
                  : selectedApproach === "expose"
                    ? `Leak internal documents revealing ${event.title.split(" ")[0]}'s hidden agenda`
                    : `Support grassroots resistance movements against ${event.title.split(" ")[0]}`}
              </p>
            </div>

            <div className="text-sm mb-2">Select a Proxim8 to deploy on this mission:</div>
          </div>

          <div className="space-y-4">
            {proxim8s.map((proxim8) => {
              const compatibility = getMissionCompatibility(proxim8)

              return (
                <div
                  key={proxim8.id}
                  className={cn(
                    "p-4 rounded-md border-2 cursor-pointer transition-all",
                    selectedProxim8 === proxim8.id
                      ? "border-yellow-500 bg-yellow-950/20"
                      : "border-gray-700 hover:border-gray-600",
                  )}
                  onClick={() => setSelectedProxim8(proxim8.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2",
                          getPersonalityColor(proxim8.personality),
                        )}
                      >
                        {getPersonalityIcon(proxim8.personality)}
                      </div>
                      <div>
                        <h4 className="font-medium">{proxim8.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Level {proxim8.level}</span>
                          <span>•</span>
                          <span className="capitalize">{proxim8.personality}</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className={cn("bg-transparent", compatibility.className)}>
                      {compatibility.compatible ? "Compatible" : "Suboptimal"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-400 mb-1">Success Rate</div>
                      <div className="font-medium">{proxim8.successRate}%</div>
                    </div>
                    <div className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-400 mb-1">Missions Completed</div>
                      <div className="font-medium">{proxim8.missionCount}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    {compatibility.icon}
                    <span className={compatibility.className}>{compatibility.bonus}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-800 flex justify-between">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            Cancel
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            disabled={!selectedProxim8}
            onClick={handleDeploy}
          >
            <Zap className="w-4 h-4 mr-2" /> Deploy Proxim8
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
