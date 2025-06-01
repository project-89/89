"use client"

import { useState, useEffect } from "react"
import { X, Shield, Download, CheckCircle, Clock, FileText, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/timeline-data"

interface MissionRewardModalProps {
  event: TimelineEvent
  onClose: () => void
  onClaim: () => void
}

export default function MissionRewardModal({ event, onClose, onClaim }: MissionRewardModalProps) {
  const [claimState, setClaimState] = useState<"pending" | "claiming" | "claimed">("pending")
  const [revealedRewards, setRevealedRewards] = useState<string[]>([])
  const [claimProgress, setClaimProgress] = useState(0)

  // Simulate the claiming process
  useEffect(() => {
    if (claimState === "claiming") {
      const rewards = [
        "timeline-points",
        "lore-fragment",
        "memory-cache",
        ...(Math.random() > 0.7 ? ["rare-intel"] : []),
      ]

      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < rewards.length) {
          setRevealedRewards((prev) => [...prev, rewards[currentIndex]])
          currentIndex++
          setClaimProgress(Math.round((currentIndex / rewards.length) * 100))
        } else {
          clearInterval(interval)
          setTimeout(() => {
            setClaimState("claimed")
          }, 1000)
        }
      }, 800)

      return () => clearInterval(interval)
    }
  }, [claimState])

  const handleStartClaim = () => {
    setClaimState("claiming")
  }

  const handleFinishClaim = () => {
    onClaim()
    onClose()
  }

  const getRewardTitle = (rewardType: string) => {
    switch (rewardType) {
      case "timeline-points":
        return "250 Timeline Points"
      case "lore-fragment":
        return 'Lore Fragment: "Internal Protocols v2.7"'
      case "memory-cache":
        return 'Memory Cache: "Hearing Footage"'
      case "rare-intel":
        return 'Rare Intel: "Oneirocom Executive Briefing"'
      default:
        return "Unknown Reward"
    }
  }

  const getRewardDescription = (rewardType: string) => {
    switch (rewardType) {
      case "timeline-points":
        return "Currency used to upgrade Proxim8s and unlock new capabilities"
      case "lore-fragment":
        return "Document detailing Oneirocom's internal security protocols and weaknesses"
      case "memory-cache":
        return "Visual record of the Neural Interface Mandate hearing disruption"
      case "rare-intel":
        return "Classified information about Oneirocom's next phase of consciousness control"
      default:
        return "Unknown item"
    }
  }

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case "timeline-points":
        return <Sparkles className="h-5 w-5 text-blue-400" />
      case "lore-fragment":
        return <FileText className="h-5 w-5 text-purple-400" />
      case "memory-cache":
        return <Clock className="h-5 w-5 text-green-400" />
      case "rare-intel":
        return <Shield className="h-5 w-5 text-yellow-400" />
      default:
        return <Download className="h-5 w-5" />
    }
  }

  const getRewardClass = (rewardType: string) => {
    switch (rewardType) {
      case "timeline-points":
        return "bg-blue-900/20 border-blue-500"
      case "lore-fragment":
        return "bg-purple-900/20 border-purple-500"
      case "memory-cache":
        return "bg-green-900/20 border-green-500"
      case "rare-intel":
        return "bg-yellow-900/20 border-yellow-500"
      default:
        return "bg-gray-900/20 border-gray-500"
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
              <CardTitle className="text-xl">
                {event.status === "completed-success" ? "Mission Successful" : "Mission Failed"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {claimState === "pending" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-400">Proxim8-7749 has returned</h3>
                  <p className="text-sm text-gray-300">
                    Your Proxim8 has completed its mission to disrupt the {event.title}
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-sm text-gray-300">
                  "Handler, mission complete. I've successfully{" "}
                  {event.status === "completed-success" ? "disrupted" : "attempted to disrupt"} the {event.title}.
                  {event.status === "completed-success"
                    ? " The timeline has shifted 5.7% toward the Green Loom. I've gathered valuable intelligence and resources for our cause."
                    : " Although we weren't fully successful, I've gathered some useful intelligence that will help future operations."}
                </p>
                <p className="text-right text-green-500 text-sm mt-2">- Proxim8-7749</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="text-sm font-medium mb-3">MISSION SUMMARY</h4>
                <p className="text-sm text-gray-300 mb-4">
                  {event.status === "completed-success"
                    ? `Your Proxim8 successfully infiltrated ${event.title.split(" ")[0]}'s systems and exposed hidden monitoring capabilities to the public. This has significantly delayed Oneirocom's timeline.`
                    : `Your Proxim8 attempted to infiltrate ${event.title.split(" ")[0]}'s systems but encountered unexpected security measures. While the primary objective wasn't achieved, some valuable data was recovered.`}
                </p>

                <div className="flex justify-between text-xs mb-1">
                  <span>Timeline Impact</span>
                  <span>{event.status === "completed-success" ? "+5.7%" : "+0.8%"}</span>
                </div>
                <Progress
                  value={event.status === "completed-success" ? 57 : 8}
                  className="h-1 bg-gray-700"
                  indicatorClassName="bg-green-500"
                />

                <div className="mt-4 text-xs text-gray-400">Community participation: {event.agentsActive} agents</div>
              </div>
            </>
          )}

          {claimState === "claiming" && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-green-400 mb-2">Downloading Timeline Data</h3>
                <p className="text-sm text-gray-300">Extracting rewards from the timeline shift...</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span>Download Progress</span>
                  <span>{claimProgress}%</span>
                </div>
                <Progress value={claimProgress} className="h-2 bg-gray-800" indicatorClassName="bg-green-500" />
              </div>

              <div className="space-y-4">
                {revealedRewards.map((reward, index) => (
                  <div
                    key={reward}
                    className={cn(
                      "p-4 rounded-md border-2 transition-all duration-300 animate-fadeIn",
                      getRewardClass(reward),
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getRewardIcon(reward)}
                      <div>
                        <h4 className="font-medium">{getRewardTitle(reward)}</h4>
                        <p className="text-sm text-gray-300 mt-1">{getRewardDescription(reward)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {claimState === "claimed" && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-green-400 mb-2">Rewards Claimed</h3>
              <p className="text-sm text-gray-300 mb-6">All timeline data has been successfully downloaded</p>
              <div className="flex justify-center">
                <Badge className="bg-blue-900/20 text-blue-300 text-sm px-3 py-1">+250 Timeline Points</Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-gray-800 flex justify-between">
          {claimState === "pending" && (
            <>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                View Later
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-black" onClick={handleStartClaim}>
                <Download className="w-4 h-4 mr-2" /> Claim Rewards
              </Button>
            </>
          )}

          {claimState === "claiming" && (
            <Button className="w-full bg-gray-800 text-gray-400 cursor-not-allowed" disabled>
              Downloading...
            </Button>
          )}

          {claimState === "claimed" && (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-black" onClick={handleFinishClaim}>
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
