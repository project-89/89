"use client"

import { useState } from "react"
import { X, Zap, Swords, Search, Users, Shield, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/timeline-data"
import Proxim8Selector from "@/components/proxim8-selector"

type Approach = "sabotage" | "expose" | "organize"

interface MissionBriefingProps {
  event: TimelineEvent
  onClose: () => void
  onDeploy: (eventId: string, approach: string) => void
}

export default function MissionBriefing({ event, onClose, onDeploy }: MissionBriefingProps) {
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null)
  const [activeTab, setActiveTab] = useState("briefing")
  const [showProxim8Selector, setShowProxim8Selector] = useState(false)

  // Sample Proxim8 data - in a real app this would come from a store or API
  const availableProxim8s = [
    {
      id: "proxim8-7749",
      name: "Proxim8-7749",
      personality: "analytical" as const,
      level: 3,
      experience: 450,
      successRate: 78,
      specialization: "expose" as const,
      missionCount: 5,
    },
    {
      id: "proxim8-8800",
      name: "Proxim8-8800",
      personality: "aggressive" as const,
      level: 2,
      experience: 320,
      successRate: 65,
      specialization: null,
      missionCount: 3,
    },
    {
      id: "proxim8-9012",
      name: "Proxim8-9012",
      personality: "diplomatic" as const,
      level: 1,
      experience: 150,
      successRate: 82,
      specialization: null,
      missionCount: 2,
    },
  ]

  const getApproachIcon = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return <Swords className="w-5 h-5 mr-2" />
      case "expose":
        return <Search className="w-5 h-5 mr-2" />
      case "organize":
        return <Users className="w-5 h-5 mr-2" />
    }
  }

  const getApproachRisk = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return "High Risk"
      case "expose":
        return "Medium Risk"
      case "organize":
        return "Low Risk"
    }
  }

  const getApproachReward = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return "8-12%"
      case "expose":
        return "4-7%"
      case "organize":
        return "2-4%"
    }
  }

  const getApproachDescription = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return `Hack ${event.title.split(" ")[0]}'s demonstration systems during the public hearing`
      case "expose":
        return `Leak internal documents revealing ${event.title.split(" ")[0]}'s hidden agenda`
      case "organize":
        return `Support grassroots resistance movements against ${event.title.split(" ")[0]}`
    }
  }

  const handleContinueToProxim8Selection = () => {
    if (selectedApproach) {
      setShowProxim8Selector(true)
    }
  }

  const handleDeployWithProxim8 = (eventId: string, approach: string, proxim8Id: string) => {
    // In a real app, you'd pass the proxim8Id to the parent component
    console.log(`Deploying ${proxim8Id} on mission ${eventId} with approach ${approach}`)
    onDeploy(eventId, approach)
    setShowProxim8Selector(false)
  }

  const renderMissionReport = () => {
    if (event.status === "completed-success") {
      return (
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="font-bold text-green-500">MISSION SUCCESSFUL</h3>
            <p className="text-sm text-gray-300 mt-2">
              Your Proxim8 successfully disrupted the {event.title}. The timeline has shifted{" "}
              {getApproachReward("expose")} toward the Green Loom.
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">MISSION REPORT</h4>
            <p className="text-sm text-gray-300">
              Your Proxim8 successfully infiltrated {event.title.split(" ")[0]}'s systems 3 hours before the public
              hearing. By introducing subtle glitches that revealed hidden monitoring subroutines, they exposed
              Oneirocom's true agenda to millions of viewers.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 1 - Infiltration:</span> Proxim8 utilized quantum tunneling
                protocols to bypass security grid. Initial penetration achieved without detection.
              </div>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 2 - System Analysis:</span> Deep scan revealed monitoring code
                hidden within enhancement modules. Evidence archived for public release.
              </div>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 3 - Demonstration Hack:</span> During live broadcast, introduced
                controlled glitches that displayed monitoring code on screens.
              </div>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 4 - Extraction:</span> Clean exit achieved. No trace of intervention
                detected by security.
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">TIMELINE IMPACT</h4>
            <ul className="text-sm space-y-1">
              <li className="text-green-400">• {event.title} delayed by 18 months</li>
              <li className="text-green-400">• Public awareness increased 340%</li>
              <li className="text-green-400">• Resistance networks strengthened across 12 major cities</li>
              <li className="text-yellow-400">• Oneirocom forced to develop more subtle control mechanisms</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">REWARDS EARNED</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-900/50 text-blue-300">250 Timeline Points</Badge>
              <Badge className="bg-purple-900/50 text-purple-300">Lore Fragment: "Internal Protocols v2.7"</Badge>
              <Badge className="bg-green-900/50 text-green-300">Memory Cache: "Hearing Footage"</Badge>
            </div>
          </div>
        </div>
      )
    } else if (event.status === "completed-failure") {
      return (
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4 py-2">
            <h3 className="font-bold text-red-500">MISSION FAILED</h3>
            <p className="text-sm text-gray-300 mt-2">
              Your Proxim8 was unable to successfully disrupt the {event.title}. Oneirocom's timeline remains intact.
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">MISSION REPORT</h4>
            <p className="text-sm text-gray-300">
              Your Proxim8 attempted to infiltrate {event.title.split(" ")[0]}'s systems but encountered unexpected
              quantum encryption protocols. The mission was compromised when security countermeasures detected the
              intrusion attempt.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 1 - Infiltration:</span> Initial access achieved, but secondary
                firewalls detected anomalous activity.
              </div>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 2 - Evasion:</span> Proxim8 attempted to deploy countermeasures but
                was isolated by security protocols.
              </div>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Phase 3 - Extraction:</span> Emergency extraction executed. Some trace
                evidence of intervention remains.
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">TIMELINE IMPACT</h4>
            <ul className="text-sm space-y-1">
              <li className="text-red-400">• {event.title} proceeds as scheduled</li>
              <li className="text-red-400">• Oneirocom security protocols strengthened</li>
              <li className="text-yellow-400">• Minor public awareness increase (12%)</li>
              <li className="text-green-400">• Valuable intelligence gathered for future missions</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">REWARDS EARNED</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-900/50 text-blue-300">50 Timeline Points</Badge>
              <Badge className="bg-purple-900/50 text-purple-300">Lore Fragment: "Security Protocols"</Badge>
            </div>
          </div>
        </div>
      )
    } else if (event.status === "in-progress") {
      return (
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-bold text-blue-500">MISSION IN PROGRESS</h3>
            <p className="text-sm text-gray-300 mt-2">
              Your Proxim8 is currently deployed in the timeline. Check back later for mission results.
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">STATUS UPDATES</h4>
            <div className="space-y-2">
              <div className="text-xs text-blue-300">
                <Clock className="w-3 h-3 inline mr-1" />
                <span className="font-mono">00:12</span> - Proxim8 successfully inserted into timeline
              </div>
              <div className="text-xs text-blue-300">
                <Clock className="w-3 h-3 inline mr-1" />
                <span className="font-mono">00:45</span> - Infiltration of target systems in progress
              </div>
              <div className="text-xs text-blue-300">
                <Clock className="w-3 h-3 inline mr-1" />
                <span className="font-mono">01:18</span> - Analyzing security protocols and adapting approach
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 italic">
            Your Proxim8 will return with a full mission report when the operation is complete.
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-2 bg-transparent">
                  {event.date}
                </Badge>
                <CardTitle className="text-xl">{event.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-4">
              <TabsList className="grid grid-cols-2 mb-4 bg-gray-800">
                <TabsTrigger value="briefing">Mission Briefing</TabsTrigger>
                {(event.status === "completed-success" ||
                  event.status === "completed-failure" ||
                  event.status === "in-progress") && <TabsTrigger value="report">Mission Report</TabsTrigger>}
              </TabsList>
            </div>

            <CardContent>
              <TabsContent value="briefing" className="mt-0 space-y-4">
                {/* Probability Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Oneirocom</span>
                    <span>Resistance</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${event.oneirocumControl}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>{event.oneirocumControl}%</span>
                    <span>{100 - event.oneirocumControl}%</span>
                  </div>
                </div>

                {/* Mission Briefing */}
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="text-sm text-gray-300">
                    {event.briefing ||
                      `The ${event.title} represents a critical point in Oneirocom's timeline. Your intervention here could significantly disrupt their plans for consciousness control.`}
                  </p>
                  <p className="text-right text-green-500 text-sm mt-2">- Seraph</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">THREAT ASSESSMENT</h3>
                  <p className="text-sm text-gray-300">{event.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">COMMUNITY STATUS</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{event.agentsActive} Agents Active</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Community Success Rate: {Math.floor(Math.random() * 30) + 40}%
                  </div>
                </div>

                {event.status === "active" && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">APPROACH OPTIONS</h3>
                    <div className="space-y-3">
                      {event.approaches.map((approach) => (
                        <div
                          key={approach}
                          className={cn(
                            "p-3 rounded-md border-2 cursor-pointer transition-all",
                            selectedApproach === approach
                              ? "border-yellow-500 bg-yellow-950/20"
                              : "border-gray-700 hover:border-gray-600",
                          )}
                          onClick={() => setSelectedApproach(approach as Approach)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getApproachIcon(approach as Approach)}
                              <span className="uppercase font-medium">{approach}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                approach === "sabotage"
                                  ? "bg-red-900/20 text-red-400"
                                  : approach === "expose"
                                    ? "bg-yellow-900/20 text-yellow-400"
                                    : "bg-green-900/20 text-green-400"
                              }
                            >
                              {getApproachRisk(approach as Approach)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-300">
                            {getApproachDescription(approach as Approach)}
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-gray-400">
                            <span>Timeline Shift: {getApproachReward(approach as Approach)}</span>
                            <span>
                              Success Rate:{" "}
                              {approach === "sabotage" ? "45-60%" : approach === "expose" ? "60-75%" : "75-90%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 p-3 rounded-md">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-purple-400 mr-2" />
                    <h3 className="text-sm font-medium text-purple-400">PROXIM8 ANALYSIS</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    "Handler, I've analyzed the {event.title} event. Their security is{" "}
                    {Math.random() > 0.5 ? "sophisticated" : "standard"}, but I've identified potential vulnerabilities.
                    I recommend the {event.approaches[Math.floor(Math.random() * event.approaches.length)]} approach for
                    optimal success probability."
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="report" className="mt-0">
                {renderMissionReport()}
              </TabsContent>
            </CardContent>

            <CardFooter className="border-t border-gray-800 flex justify-between">
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                Cancel
              </Button>

              {event.status === "active" && (
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={!selectedApproach}
                  onClick={handleContinueToProxim8Selection}
                >
                  <Zap className="w-4 h-4 mr-2" /> Continue
                </Button>
              )}
            </CardFooter>
          </Tabs>
        </Card>
      </div>

      {/* Proxim8 Selector Modal */}
      {showProxim8Selector && selectedApproach && (
        <Proxim8Selector
          event={event}
          proxim8s={availableProxim8s}
          onClose={() => setShowProxim8Selector(false)}
          onDeploy={handleDeployWithProxim8}
          selectedApproach={selectedApproach}
        />
      )}
    </>
  )
}
