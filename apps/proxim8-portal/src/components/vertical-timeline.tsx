"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Circle, Check, X, Swords, Clock, Users, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/timeline-data"

interface VerticalTimelineProps {
  events: TimelineEvent[]
  onSelectEvent: (event: TimelineEvent) => void
}

export default function VerticalTimeline({ events, onSelectEvent }: VerticalTimelineProps) {
  const [activePeriod, setActivePeriod] = useState<"early" | "mid" | "late">("early")
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})

  const toggleExpand = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Zap className="w-5 h-5 text-yellow-400" />
      case "locked":
        return <Circle className="w-5 h-5 text-gray-600" />
      case "completed-success":
        return <Check className="w-5 h-5 text-green-500" />
      case "completed-failure":
        return <X className="w-5 h-5 text-red-500" />
      case "contested":
        return <Swords className="w-5 h-5 text-purple-500" />
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-yellow-400 bg-yellow-950/20"
      case "locked":
        return "border-gray-700 bg-gray-900"
      case "completed-success":
        return "border-green-500 bg-green-950/20"
      case "completed-failure":
        return "border-red-500 bg-red-950/20"
      case "contested":
        return "border-purple-500 bg-purple-950/20"
      case "in-progress":
        return "border-blue-400 bg-blue-950/20"
    }
  }

  // Filter events by period
  const filteredEvents = events.filter((event) => event.period === activePeriod)

  return (
    <div className="w-full">
      {/* Period Selector */}
      <Tabs
        value={activePeriod}
        onValueChange={(value) => setActivePeriod(value as "early" | "mid" | "late")}
        className="w-full mb-6"
      >
        <TabsList className="grid grid-cols-3 bg-gray-900 border border-gray-800">
          <TabsTrigger value="early" className="data-[state=active]:bg-green-900/30">
            2025-2035
          </TabsTrigger>
          <TabsTrigger value="mid" className="data-[state=active]:bg-yellow-900/30">
            2036-2055
          </TabsTrigger>
          <TabsTrigger value="late" className="data-[state=active]:bg-red-900/30">
            2056-2089
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800 md:left-1/2 md:-ml-0.5"></div>

        <div className="space-y-6">
          {filteredEvents.map((event, index) => (
            <div key={event.id} className={cn("relative", index === 0 && "pt-2")}>
              {/* Timeline Node */}
              <div
                className={cn(
                  "absolute left-4 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transform -translate-x-1/2 md:left-1/2",
                  getStatusColor(event.status),
                )}
              >
                {getStatusIcon(event.status)}
              </div>

              {/* Timeline Content */}
              <div
                className={cn(
                  "ml-12 md:w-1/2 md:ml-0",
                  index % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8 md:ml-auto",
                )}
              >
                <Card
                  className={cn(
                    "bg-gray-900 border-gray-800 hover:bg-gray-900/80 transition-colors",
                    event.status !== "locked" && "cursor-pointer",
                  )}
                  onClick={() => event.status !== "locked" && onSelectEvent(event)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "bg-transparent",
                          event.status === "active"
                            ? "text-yellow-400"
                            : event.status === "completed-success"
                              ? "text-green-500"
                              : event.status === "completed-failure"
                                ? "text-red-500"
                                : event.status === "contested"
                                  ? "text-purple-500"
                                  : event.status === "in-progress"
                                    ? "text-blue-400"
                                    : "text-gray-400",
                        )}
                      >
                        {event.date}
                      </Badge>
                      {event.status !== "locked" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(event.id)
                          }}
                          className="h-7 w-7 p-0"
                        >
                          {expandedEvents[event.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    {expandedEvents[event.id] ? (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-300">{event.description}</div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Oneirocom Control</span>
                            <span>{event.oneirocumControl}%</span>
                          </div>
                          <Progress
                            value={event.oneirocumControl}
                            className="h-1 bg-gray-700"
                            indicatorClassName="bg-red-500"
                          />
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{event.agentsActive} Agents Active</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 line-clamp-2">{event.description}</div>
                    )}
                  </CardContent>

                  {event.status === "active" && !expandedEvents[event.id] && (
                    <CardFooter>
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectEvent(event)
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" /> Intervene
                      </Button>
                    </CardFooter>
                  )}

                  {event.status === "in-progress" && !expandedEvents[event.id] && (
                    <CardFooter>
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Mission Progress</span>
                          <span>
                            {event.missionEndTime
                              ? Math.round(
                                  ((Date.now() - (event.missionEndTime - 2 * 60 * 1000)) / (2 * 60 * 1000)) * 100,
                                )
                              : 50}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            event.missionEndTime
                              ? Math.round(
                                  ((Date.now() - (event.missionEndTime - 2 * 60 * 1000)) / (2 * 60 * 1000)) * 100,
                                )
                              : 50
                          }
                          className="h-1 bg-gray-700"
                          indicatorClassName="bg-blue-400"
                        />
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
