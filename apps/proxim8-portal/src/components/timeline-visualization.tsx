"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Circle,
  Check,
  X,
  Swords,
  ChevronDown,
  ChevronUp,
  Shield,
  Search,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWallet } from "@/components/wallet-provider";
import MissionBriefing from "@/components/mission-briefing";

// Types
type EventStatus =
  | "active"
  | "locked"
  | "completed-success"
  | "completed-failure"
  | "contested"
  | "in-progress";
type Approach = "sabotage" | "expose" | "organize";
type TimelinePeriod = "early" | "mid" | "late";

interface TimelineEvent {
  id: string;
  date: string;
  year: number;
  title: string;
  status: EventStatus;
  oneirocumControl: number;
  description: string;
  approaches: Approach[];
  agentsActive: number;
  isExpanded?: boolean;
  isResponse?: boolean;
  parentId?: string;
  period: TimelinePeriod;
  missionEndTime?: number;
  briefing?: string;
}

// Generate sample data with 30+ missions
const generateTimelineEvents = (): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Early period (2025-2035)
  events.push({
    id: "event1",
    date: "June 2027",
    year: 2027,
    title: "Neural Interface Mandate",
    status: "active",
    oneirocumControl: 73,
    description:
      "Corporate cities implement mandatory neural interfaces for all employees. Resistance is minimal due to economic pressure.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 47,
    isExpanded: false,
    period: "early",
    briefing:
      "The Neural Interface Mandate represents Oneirocom's first major step toward consciousness control. Their NeuralLink technology is being positioned as a productivity tool, but our intelligence suggests hidden monitoring capabilities. The Senate hearing on March 15th provides a critical intervention point.",
  });

  events.push({
    id: "event2",
    date: "March 2029",
    year: 2029,
    title: "Algorithmic Consciousness Act",
    status: "active",
    oneirocumControl: 68,
    description:
      "Mandatory 'wellness' algorithms manipulate emotions through neural interfaces.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 32,
    isExpanded: false,
    period: "early",
    briefing:
      "The Algorithmic Consciousness Act introduces mandatory 'wellness' algorithms that subtly manipulate emotions through neural interfaces. Marketed as mental health support, these algorithms actually condition users toward corporate compliance and consumption patterns.",
  });

  events.push({
    id: "event3",
    date: "October 2031",
    year: 2031,
    title: "Synthetic Reality Bill",
    status: "locked",
    oneirocumControl: 65,
    description: "Legal framework for synthetic reality ownership.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 28,
    isExpanded: false,
    period: "early",
    briefing:
      "The Synthetic Reality Bill establishes a legal framework that gives corporations ownership rights over synthetic experiences. This legislation will eventually allow Oneirocom to claim intellectual property rights over dream content and imagination.",
  });

  // Add more early period events
  for (let year = 2032; year <= 2035; year++) {
    events.push({
      id: `event-early-${year}`,
      date: `${["January", "April", "July", "October"][Math.floor(Math.random() * 4)]} ${year}`,
      year,
      title: [
        "Dream Monitoring Initiative",
        "Neural Data Privacy Rollback",
        "Consciousness Mapping Project",
        "Synthetic Experience Marketplace",
      ][Math.floor(Math.random() * 4)],
      status: "locked",
      oneirocumControl: 60 + Math.floor(Math.random() * 20),
      description: "Oneirocom expands control over neural interfaces and data.",
      approaches: ["sabotage", "expose", "organize"],
      agentsActive: Math.floor(Math.random() * 30) + 10,
      isExpanded: false,
      period: "early",
      briefing:
        "This event represents another step in Oneirocom's plan to establish control over human consciousness through technology and legislation.",
    });
  }

  // Mid period (2036-2055)
  for (let year = 2036; year <= 2055; year += 2) {
    events.push({
      id: `event-mid-${year}`,
      date: `${["February", "May", "August", "November"][Math.floor(Math.random() * 4)]} ${year}`,
      year,
      title: [
        "Consciousness Encryption Ban",
        "Mandatory Dream Reporting",
        "Thought Pattern Standardization",
        "Neural Compliance Enforcement",
      ][Math.floor(Math.random() * 4)],
      status: "locked",
      oneirocumControl: 70 + Math.floor(Math.random() * 15),
      description:
        "Oneirocom strengthens control over thought and consciousness.",
      approaches: ["sabotage", "expose", "organize"],
      agentsActive: Math.floor(Math.random() * 20) + 5,
      isExpanded: false,
      period: "mid",
      briefing:
        "As Oneirocom's influence grows, they implement more aggressive measures to standardize and control human thought patterns.",
    });
  }

  // Late period (2056-2089)
  for (let year = 2056; year <= 2089; year += 3) {
    events.push({
      id: `event-late-${year}`,
      date: `${["March", "June", "September", "December"][Math.floor(Math.random() * 4)]} ${year}`,
      year,
      title: [
        "Consciousness Unification Protocol",
        "Autonomous Thought Elimination",
        "Reality Perception Standardization",
        "Final Consciousness Integration",
      ][Math.floor(Math.random() * 4)],
      status: "locked",
      oneirocumControl: 80 + Math.floor(Math.random() * 15),
      description:
        "Oneirocom's final steps toward total consciousness control.",
      approaches: ["sabotage", "expose", "organize"],
      agentsActive: Math.floor(Math.random() * 10),
      isExpanded: false,
      period: "late",
      briefing:
        "In these late stages, Oneirocom implements their most aggressive measures, moving toward complete integration and control of human consciousness.",
    });
  }

  // Sort by year
  events.sort((a, b) => a.year - b.year);

  return events;
};

export default function TimelineVisualization() {
  const { connected, hasProxim8 } = useWallet();
  const [events, setEvents] = useState<TimelineEvent[]>(
    generateTimelineEvents()
  );
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const [activePeriod, setActivePeriod] = useState<TimelinePeriod>("early");
  const [communityProgress, setCommunityProgress] = useState(15); // Green Loom percentage
  const timelineRef = useRef<HTMLDivElement>(null);

  // Update mission timers
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.status === "in-progress" && event.missionEndTime) {
            if (Date.now() >= event.missionEndTime) {
              // Mission completed
              return {
                ...event,
                status:
                  Math.random() > 0.3
                    ? "completed-success"
                    : "completed-failure",
                missionEndTime: undefined,
              };
            }
          }
          return event;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleIntervene = (eventId: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          // Set mission in progress with 24-hour timer
          // For demo purposes, we'll use a shorter timer (2 minutes)
          const missionEndTime = Date.now() + 2 * 60 * 1000; // 2 minutes

          return {
            ...event,
            status: "in-progress",
            missionEndTime,
            isExpanded: false,
          };
        }
        return event;
      })
    );

    setShowMissionBriefing(false);
  };

  const toggleExpand = (eventId: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? { ...event, isExpanded: !event.isExpanded }
          : event
      )
    );
  };

  const openMissionBriefing = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowMissionBriefing(true);
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case "active":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "locked":
        return <Circle className="w-5 h-5 text-gray-400" />;
      case "completed-success":
        return <Check className="w-5 h-5 text-green-500" />;
      case "completed-failure":
        return <X className="w-5 h-5 text-red-500" />;
      case "contested":
        return <Swords className="w-5 h-5 text-purple-500" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
    }
  };

  const getApproachIcon = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return <Swords className="w-4 h-4 mr-1" />;
      case "expose":
        return <Search className="w-4 h-4 mr-1" />;
      case "organize":
        return <Users className="w-4 h-4 mr-1" />;
    }
  };

  const getApproachRisk = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return "High Risk";
      case "expose":
        return "Medium Risk";
      case "organize":
        return "Low Risk";
    }
  };

  const getApproachReward = (approach: Approach) => {
    switch (approach) {
      case "sabotage":
        return "8-12%";
      case "expose":
        return "4-7%";
      case "organize":
        return "2-4%";
    }
  };

  const getMissionTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredEvents = events.filter(
    (event) => event.period === activePeriod
  );

  const scrollTimeline = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      timelineRef.current.scrollLeft += scrollAmount;
    }
  };

  if (!connected || !hasProxim8) {
    return null;
  }

  return (
    <div className="w-full space-y-8">
      {/* Community Progress */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium">Timeline Status</h2>
          <Badge variant="outline" className="bg-green-900/20 text-green-400">
            {communityProgress}% Green Loom
          </Badge>
        </div>
        <div className="mb-2">
          <Progress
            value={communityProgress}
            className="h-2 bg-red-900/50"
            indicatorClassName="bg-green-500"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Oneirocom Control: {100 - communityProgress}%</span>
          <span>Resistance Control: {communityProgress}%</span>
        </div>
        <div className="mt-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span>
              Critical timeline event approaching: Neural Interface Mandate
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            47 agents currently active on this mission
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs
        value={activePeriod}
        onValueChange={(value) => setActivePeriod(value as TimelinePeriod)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger
            value="early"
            className="data-[state=active]:bg-green-900/30"
          >
            2025-2035
          </TabsTrigger>
          <TabsTrigger
            value="mid"
            className="data-[state=active]:bg-yellow-900/30"
          >
            2036-2055
          </TabsTrigger>
          <TabsTrigger
            value="late"
            className="data-[state=active]:bg-red-900/30"
          >
            2056-2089
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Timeline River Visualization */}
      <div className="relative w-full">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/80"
          onClick={() => scrollTimeline("left")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div
          ref={timelineRef}
          className="relative w-full h-24 mb-12 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="absolute inset-0 flex items-center min-w-max px-12">
            <div className="w-[1500px] h-8 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full overflow-hidden">
              <div className="w-full h-full bg-[url('/placeholder.svg?height=32&width=1500')] opacity-20 animate-flow"></div>
            </div>
          </div>

          {/* Timeline Labels */}
          <div className="absolute inset-0 flex justify-between items-center px-16 min-w-max">
            <div className="text-sm font-medium">
              {activePeriod === "early"
                ? "2025"
                : activePeriod === "mid"
                  ? "2036"
                  : "2056"}
            </div>
            <div className="text-sm font-medium">
              {activePeriod === "early"
                ? "2035"
                : activePeriod === "mid"
                  ? "2055"
                  : "2089"}
            </div>
          </div>

          {/* Event Markers */}
          <div className="absolute inset-0 flex items-center min-w-max px-12">
            {filteredEvents.map((event, index) => {
              // Calculate position based on year within the current period
              let position;
              if (activePeriod === "early") {
                position = ((event.year - 2025) / (2035 - 2025)) * 100;
              } else if (activePeriod === "mid") {
                position = ((event.year - 2036) / (2055 - 2036)) * 100;
              } else {
                position = ((event.year - 2056) / (2089 - 2056)) * 100;
              }

              return (
                <div
                  key={event.id}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${position}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer",
                      event.status === "active"
                        ? "bg-yellow-400 animate-pulse"
                        : event.status === "completed-success"
                          ? "bg-green-500"
                          : event.status === "completed-failure"
                            ? "bg-red-500"
                            : event.status === "contested"
                              ? "bg-purple-500"
                              : event.status === "in-progress"
                                ? "bg-blue-400 animate-pulse"
                                : "bg-gray-400"
                    )}
                    onClick={() =>
                      event.status !== "locked" && openMissionBriefing(event)
                    }
                  >
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="text-xs mt-1 whitespace-nowrap">
                    {event.date}
                  </div>

                  {/* Connection line for response events */}
                  {event.isResponse && event.parentId && (
                    <div
                      className="absolute h-8 w-0.5 bg-purple-500"
                      style={{
                        top: "-40px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/80"
          onClick={() => scrollTimeline("right")}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents
          .filter((event) => event.status !== "locked")
          .slice(0, 6)
          .map((event) => (
            <Card
              key={event.id}
              className={cn(
                "border-t-4 transition-all duration-300",
                event.status === "active"
                  ? "border-t-yellow-400"
                  : event.status === "completed-success"
                    ? "border-t-green-500"
                    : event.status === "completed-failure"
                      ? "border-t-red-500"
                      : event.status === "contested"
                        ? "border-t-purple-500"
                        : event.status === "in-progress"
                          ? "border-t-blue-400"
                          : "border-t-gray-400"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(event.status)} {event.date}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(event.id)}
                    className="h-8 w-8 p-0"
                  >
                    {event.isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-base font-medium">{event.title}</div>
              </CardHeader>

              <CardContent>
                {/* Probability Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Oneirocom</span>
                    <span>Resistance</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${event.oneirocumControl}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>{event.oneirocumControl}%</span>
                    <span>{100 - event.oneirocumControl}%</span>
                  </div>
                </div>

                {/* Mission Timer for in-progress missions */}
                {event.status === "in-progress" && event.missionEndTime && (
                  <div className="mb-4 bg-gray-800 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">
                        Mission in Progress
                      </div>
                      <div className="text-blue-400 font-mono">
                        {getMissionTimeRemaining(event.missionEndTime)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Your Proxim8 is currently deployed. Status updates will
                      appear here.
                    </div>
                    <div className="mt-2 text-xs text-blue-300">
                      "Infiltration successful. Analyzing security protocols..."
                    </div>
                  </div>
                )}

                {/* Expanded Content */}
                {event.isExpanded ? (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-700">
                    <div>
                      <div className="text-sm font-medium mb-1">Threat:</div>
                      <div className="text-sm">{event.description}</div>
                    </div>

                    {event.status === "active" && (
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Approaches:
                        </div>
                        <div className="space-y-2">
                          {event.approaches.map((approach) => (
                            <div
                              key={approach}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center">
                                {getApproachIcon(approach)}
                                <span className="uppercase mr-2">
                                  {approach}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({getApproachRisk(approach)})
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                Shift: {getApproachReward(approach)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Community: {event.agentsActive} Agents Active</span>
                    </div>

                    {event.isResponse && (
                      <div className="flex items-center text-sm text-purple-400">
                        <Shield className="w-4 h-4 mr-2" />
                        <span>Time Agent Echo assigned</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    {event.status === "active" && (
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => openMissionBriefing(event)}
                      >
                        <Zap className="w-4 h-4 mr-2" /> INTERVENE
                      </Button>
                    )}

                    {event.status === "completed-success" && (
                      <div className="text-sm text-green-500 font-medium">
                        Status: DISRUPTED
                        <div className="text-xs text-gray-400">
                          Community Success Rate: 72%
                        </div>
                      </div>
                    )}

                    {event.status === "completed-failure" && (
                      <div className="text-sm text-red-500 font-medium">
                        Status: FAILED
                        <div className="text-xs text-gray-400">
                          Community Success Rate: 28%
                        </div>
                      </div>
                    )}

                    {event.isResponse && (
                      <div className="text-sm text-purple-400 font-medium flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Oneirocom pivots to gaming vector
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                {!event.isExpanded &&
                  event.status !== "active" &&
                  event.status !== "in-progress" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 hover:text-white w-full"
                      onClick={() => openMissionBriefing(event)}
                    >
                      <Info className="w-3 h-3 mr-1" /> View Mission Report
                    </Button>
                  )}
              </CardFooter>
            </Card>
          ))}
      </div>

      {/* Mission Briefing Modal */}
      {showMissionBriefing && selectedEvent && (
        <MissionBriefing
          event={selectedEvent}
          onClose={() => setShowMissionBriefing(false)}
          onDeploy={handleIntervene}
        />
      )}
    </div>
  );
}
