"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  Clock,
  Zap,
  User,
  BarChart3,
  Calendar,
  Layers,
  Menu,
  X,
  ChevronRight,
  Users,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import VerticalTimeline from "@/components/vertical-timeline";
import MissionBriefing from "@/components/mission-briefing";
import MissionRewardModal from "@/components/mission-reward-modal";
import ProximCard from "@/components/proxim-card";
import {
  generateTimelineEvents,
  type TimelineEvent,
} from "@/lib/timeline-data";
import LoreCollection from "@/components/lore-collection";

export default function AgentDashboard() {
  const { connected, address, hasProxim8 } = useWallet();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState<TimelineEvent[]>(
    generateTimelineEvents()
  );
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const [showMissionReward, setShowMissionReward] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter events by status
  const activeEvents = events.filter((event) => event.status === "active");
  const inProgressEvents = events.filter(
    (event) => event.status === "in-progress"
  );
  const completedEvents = events.filter(
    (event) =>
      event.status === "completed-success" ||
      event.status === "completed-failure"
  );

  // Agent stats
  const agentStats = {
    timelinePoints: 750,
    missionsCompleted: inProgressEvents.length + completedEvents.length,
    successRate: Math.round(
      (completedEvents.filter((e) => e.status === "completed-success").length /
        Math.max(completedEvents.length, 1)) *
        100
    ),
    timelineInfluence: 8.3,
    proxim8sOwned: 3,
    proxim8sDeployed: inProgressEvents.length,
  };

  // Community progress
  const communityProgress = 23; // Green Loom percentage

  const openMissionBriefing = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowMissionBriefing(true);
  };

  const handleDeploy = (eventId: string, approach: string) => {
    // This would be implemented to deploy a Proxim8 on a mission
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
          };
        }
        return event;
      })
    );
    setShowMissionBriefing(false);
  };

  const handleCompleteMission = (eventId: string) => {
    // Simulate mission completion
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          return {
            ...event,
            status:
              Math.random() > 0.3 ? "completed-success" : "completed-failure",
            missionEndTime: undefined,
          };
        }
        return event;
      })
    );

    // Show reward modal
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowMissionReward(true);
    }
  };

  const handleClaimReward = () => {
    // In a real app, you would update the user's rewards, points, etc.
    console.log("Rewards claimed");
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-gray-200">
      {/* Mobile Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-green-400">Project 89</h1>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-xs">{address?.substring(0, 6)}</span>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 p-4 transition-transform duration-200 transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-green-400">
              Agent Dashboard
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("dashboard");
                setSidebarOpen(false);
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("timeline");
                setSidebarOpen(false);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("proxim8s");
                setSidebarOpen(false);
              }}
            >
              <Layers className="h-4 w-4 mr-2" />
              Proxim8s
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("lore");
                setSidebarOpen(false);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Lore Collection
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-800 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Agent Status</span>
              </div>
              <div className="text-xs text-gray-400">
                <div className="flex justify-between mb-1">
                  <span>Timeline Points:</span>
                  <span className="text-green-400">
                    {agentStats.timelinePoints} TP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Proxim8s:</span>
                  <span>
                    {agentStats.proxim8sDeployed}/{agentStats.proxim8sOwned}{" "}
                    Deployed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-gray-900 border-r border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-green-400">
              Agent Dashboard
            </h2>
          </div>

          <div className="space-y-1 mb-6">
            <Button
              variant={activeTab === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "timeline" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("timeline")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant={activeTab === "proxim8s" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("proxim8s")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Proxim8s
            </Button>
            <Button
              variant={activeTab === "lore" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("lore")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Lore Collection
            </Button>
          </div>

          <div className="bg-gray-800 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">Agent Status</span>
            </div>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Timeline Points:</span>
                <span className="text-green-400">
                  {agentStats.timelinePoints} TP
                </span>
              </div>
              <div className="flex justify-between">
                <span>Missions Completed:</span>
                <span>{agentStats.missionsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span>{agentStats.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Timeline Influence:</span>
                <span>+{agentStats.timelineInfluence}%</span>
              </div>
              <div className="flex justify-between">
                <span>Proxim8s:</span>
                <span>
                  {agentStats.proxim8sDeployed}/{agentStats.proxim8sOwned}{" "}
                  Deployed
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-gray-500 mb-2">COMMUNITY PROGRESS</div>
            <div className="mb-2">
              <Progress
                value={communityProgress}
                className="h-2 bg-red-900/50"
                indicatorClassName="bg-green-500"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Oneirocom: {100 - communityProgress}%</span>
              <span>Resistance: {communityProgress}%</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsContent value="dashboard" className="mt-0">
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-4 text-green-400 hidden md:block">
                  Agent Dashboard
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Timeline Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        {agentStats.timelinePoints} TP
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Missions Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {agentStats.missionsCompleted}
                      </div>
                      <div className="text-xs text-gray-500">
                        Success Rate: {agentStats.successRate}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Timeline Influence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        +{agentStats.timelineInfluence}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Toward Green Loom
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Proxim8s
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {agentStats.proxim8sDeployed}/{agentStats.proxim8sOwned}
                      </div>
                      <div className="text-xs text-gray-500">
                        Currently Deployed
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Critical Alert */}
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-400">
                        Critical Timeline Event
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        The Neural Interface Mandate (June 2027) is approaching
                        a critical threshold. Community intervention required to
                        prevent Oneirocom dominance.
                      </p>
                      <Button
                        className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black"
                        size="sm"
                        onClick={() => {
                          const event = events.find((e) => e.id === "event1");
                          if (event) openMissionBriefing(event);
                        }}
                      >
                        View Mission
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Missions */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Active Missions</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-gray-700"
                    onClick={() => setActiveTab("timeline")}
                  >
                    View All <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                {inProgressEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressEvents.slice(0, 3).map((event) => (
                      <Card
                        key={event.id}
                        className="bg-gray-900 border-gray-800 border-t-4 border-t-blue-400"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <Badge
                              variant="outline"
                              className="bg-blue-900/20 text-blue-400"
                            >
                              {event.date}
                            </Badge>
                            <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                          </div>
                          <CardTitle className="text-base mt-2">
                            {event.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-xs text-gray-400 mb-3">
                            {event.description}
                          </div>
                          <div className="bg-gray-800 p-2 rounded-md">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Mission Progress</span>
                              <span>
                                {event.missionEndTime
                                  ? Math.round(
                                      ((Date.now() -
                                        (event.missionEndTime -
                                          2 * 60 * 1000)) /
                                        (2 * 60 * 1000)) *
                                        100
                                    )
                                  : 50}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                event.missionEndTime
                                  ? Math.round(
                                      ((Date.now() -
                                        (event.missionEndTime -
                                          2 * 60 * 1000)) /
                                        (2 * 60 * 1000)) *
                                        100
                                    )
                                  : 50
                              }
                              className="h-1 bg-gray-700"
                              indicatorClassName="bg-blue-400"
                            />
                            <div className="text-xs text-blue-300 mt-2">
                              "Infiltration successful. Analyzing security
                              protocols..."
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="w-full flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => openMissionBriefing(event)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs border-blue-500 text-blue-400 hover:bg-blue-950/20"
                              onClick={() => handleCompleteMission(event.id)}
                            >
                              Complete
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-md p-4 text-center text-gray-400">
                    No active missions. Deploy your Proxim8 to disrupt the
                    timeline.
                  </div>
                )}
              </div>

              {/* Available Missions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Available Missions</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-gray-700"
                    onClick={() => setActiveTab("timeline")}
                  >
                    View All <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeEvents.slice(0, 3).map((event) => (
                    <Card
                      key={event.id}
                      className="bg-gray-900 border-gray-800 border-t-4 border-t-yellow-400"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge
                            variant="outline"
                            className="bg-yellow-900/20 text-yellow-400"
                          >
                            {event.date}
                          </Badge>
                          <Zap className="h-4 w-4 text-yellow-400" />
                        </div>
                        <CardTitle className="text-base mt-2">
                          {event.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-xs text-gray-400 mb-3">
                          {event.description}
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Oneirocom Control</span>
                          <span>{event.oneirocumControl}%</span>
                        </div>
                        <Progress
                          value={event.oneirocumControl}
                          className="h-1 bg-gray-700"
                          indicatorClassName="bg-red-500"
                        />
                        <div className="flex items-center mt-3 text-xs text-gray-400">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{event.agentsActive} Agents Active</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                          size="sm"
                          onClick={() => openMissionBriefing(event)}
                        >
                          <Zap className="h-3 w-3 mr-1" /> Intervene
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <h1 className="text-xl font-bold mb-4 text-green-400 hidden md:block">
                Timeline
              </h1>
              <VerticalTimeline
                events={events}
                onSelectEvent={openMissionBriefing}
              />
            </TabsContent>

            <TabsContent value="proxim8s" className="mt-0">
              <h1 className="text-xl font-bold mb-4 text-green-400 hidden md:block">
                Your Proxim8s
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Deployed Proxim8s */}
                {inProgressEvents.map((event, index) => (
                  <ProximCard
                    key={`deployed-${index}`}
                    id={`proxim8-${7749 + index}`}
                    name={`Proxim8-${7749 + index}`}
                    status="deployed"
                    personality={
                      ["analytical", "aggressive", "diplomatic"][index % 3] as
                        | "analytical"
                        | "aggressive"
                        | "diplomatic"
                    }
                    mission={event}
                    onViewMission={() => openMissionBriefing(event)}
                  />
                ))}

                {/* Available Proxim8s */}
                {Array.from({
                  length: Math.max(
                    0,
                    agentStats.proxim8sOwned - agentStats.proxim8sDeployed
                  ),
                }).map((_, index) => (
                  <ProximCard
                    key={`available-${index}`}
                    id={`proxim8-${8800 + index}`}
                    name={`Proxim8-${8800 + index}`}
                    status="available"
                    personality={
                      ["analytical", "aggressive", "diplomatic"][
                        (index + 1) % 3
                      ] as "analytical" | "aggressive" | "diplomatic"
                    }
                    onDeploy={() => setActiveTab("timeline")}
                  />
                ))}

                {/* Unclaimed Proxim8 */}
                <Card className="bg-gray-900 border-gray-800 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <Shield className="h-8 w-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">
                      Unclaimed Proxim8
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Claim a new Proxim8 to increase your timeline influence
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700 text-black">
                      Claim Proxim8
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="lore" className="mt-0">
              <h1 className="text-xl font-bold mb-4 text-green-400 hidden md:block">
                Lore Collection
              </h1>
              <LoreCollection />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Mission Briefing Modal */}
      {showMissionBriefing && selectedEvent && (
        <MissionBriefing
          event={selectedEvent}
          onClose={() => setShowMissionBriefing(false)}
          onDeploy={handleDeploy}
        />
      )}

      {/* Mission Reward Modal */}
      {showMissionReward && selectedEvent && (
        <MissionRewardModal
          event={selectedEvent}
          onClose={() => setShowMissionReward(false)}
          onClaim={handleClaimReward}
        />
      )}
    </div>
  );
}
