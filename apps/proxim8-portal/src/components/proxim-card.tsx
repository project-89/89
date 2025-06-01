"use client"
import { useRouter } from "next/navigation"
import { Shield, Zap, Clock, Cpu, Brain, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/timeline-data"

interface ProximCardProps {
  id: string
  name: string
  status: "deployed" | "available"
  personality: "analytical" | "aggressive" | "diplomatic"
  mission?: TimelineEvent
  onViewMission?: () => void
  onDeploy?: () => void
  onUpgrade?: () => void
}

export default function ProximCard({
  id,
  name,
  status,
  personality,
  mission,
  onViewMission,
  onDeploy,
  onUpgrade,
}: ProximCardProps) {
  const router = useRouter()

  const getPersonalityIcon = () => {
    switch (personality) {
      case "analytical":
        return <Brain className="h-4 w-4 text-blue-400" />
      case "aggressive":
        return <Zap className="h-4 w-4 text-red-400" />
      case "diplomatic":
        return <Users className="h-4 w-4 text-green-400" />
    }
  }

  const getPersonalityDescription = () => {
    switch (personality) {
      case "analytical":
        return "Better at EXPOSE missions, provides detailed intelligence"
      case "aggressive":
        return "Better at SABOTAGE missions, higher risk tolerance"
      case "diplomatic":
        return "Better at ORGANIZE missions, builds lasting networks"
    }
  }

  const getPersonalityColor = () => {
    switch (personality) {
      case "analytical":
        return "border-blue-500 bg-blue-950/20"
      case "aggressive":
        return "border-red-500 bg-red-950/20"
      case "diplomatic":
        return "border-green-500 bg-green-950/20"
    }
  }

  // Sample stats - in a real app these would come from props
  const level = 2
  const experience = 320
  const nextLevelExp = 500

  const handleCardClick = () => {
    router.push(`/proxim8/${id}`)
  }

  return (
    <Card
      className={cn(
        "bg-gray-900 border-gray-800 cursor-pointer transition-all hover:bg-gray-800/80",
        status === "deployed" && "border-t-4 border-t-blue-400",
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="bg-transparent">
            {id}
          </Badge>
          {status === "deployed" ? (
            <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
          ) : (
            <Shield className="h-4 w-4 text-green-500" />
          )}
        </div>
        <CardTitle className="text-base mt-2 flex items-center justify-between">
          {name}
          <Badge className="text-xs">Lvl {level}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-purple-400" />
          <span>Proxim8 AI</span>
          <Badge
            variant="outline"
            className={cn(
              "ml-auto",
              personality === "analytical"
                ? "bg-blue-900/20 text-blue-400"
                : personality === "aggressive"
                  ? "bg-red-900/20 text-red-400"
                  : "bg-green-900/20 text-green-400",
            )}
          >
            {personality}
          </Badge>
        </div>

        <div className={cn("p-3 rounded-md border text-xs", getPersonalityColor())}>
          <div className="flex items-center gap-2 mb-1">
            {getPersonalityIcon()}
            <span className="font-medium capitalize">{personality} Personality</span>
          </div>
          <p className="text-gray-300">{getPersonalityDescription()}</p>
        </div>

        {/* Experience Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Experience</span>
            <span>
              {experience}/{nextLevelExp} XP
            </span>
          </div>
          <Progress
            value={(experience / nextLevelExp) * 100}
            className="h-1 bg-gray-800"
            indicatorClassName="bg-purple-500"
          />
        </div>

        {status === "deployed" && mission && (
          <div>
            <div className="text-sm font-medium mb-1">Current Mission</div>
            <div className="text-xs text-gray-400 mb-2">{mission.title}</div>
            <div className="flex justify-between text-xs mb-1">
              <span>Mission Progress</span>
              <span>
                {mission.missionEndTime
                  ? Math.round(((Date.now() - (mission.missionEndTime - 2 * 60 * 1000)) / (2 * 60 * 1000)) * 100)
                  : 50}
                %
              </span>
            </div>
            <Progress
              value={
                mission.missionEndTime
                  ? Math.round(((Date.now() - (mission.missionEndTime - 2 * 60 * 1000)) / (2 * 60 * 1000)) * 100)
                  : 50
              }
              className="h-1 bg-gray-800"
              indicatorClassName="bg-blue-400"
            />
          </div>
        )}
      </CardContent>

      <CardFooter>
        {status === "deployed" && onViewMission && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onViewMission()
            }}
          >
            View Mission
          </Button>
        )}
        {status === "available" && (
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-black"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDeploy && onDeploy()
              }}
            >
              Deploy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onUpgrade && onUpgrade()
              }}
            >
              Upgrade
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
