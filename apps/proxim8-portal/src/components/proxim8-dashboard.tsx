"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Zap,
  Brain,
  Users,
  Cpu,
  Clock,
  ChevronRight,
  MessageSquare,
  Settings,
  Award,
  History,
  Sparkles,
  Dices,
  Wrench,
  Download,
  Upload,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/timeline-data";
import Proxim8Viewer from "@/components/proxim8-viewer";

interface Proxim8Stats {
  id: string;
  name: string;
  personality: "analytical" | "aggressive" | "diplomatic";
  level: number;
  experience: number;
  nextLevelExp: number;
  successRate: number;
  specialization: "sabotage" | "expose" | "organize" | null;
  missionCount: number;
  status: "deployed" | "available";
  mission?: TimelineEvent;
  attributes: {
    intelligence: number;
    stealth: number;
    resilience: number;
    influence: number;
    adaptability: number;
  };
  skills: {
    name: string;
    level: number;
    description: string;
  }[];
  missionHistory: {
    id: string;
    title: string;
    date: string;
    outcome: "success" | "failure";
    approach: "sabotage" | "expose" | "organize";
    rewardXP: number;
  }[];
}

interface Proxim8DashboardProps {
  proxim8Id: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

export default function Proxim8Dashboard({
  proxim8Id,
  onClose,
  isFullPage = false,
}: Proxim8DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "proxim8"; content: string }[]
  >([
    { role: "proxim8", content: "Hello, Handler. How can I assist you today?" },
  ]);
  const [messageInput, setMessageInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sample data - in a real app, this would come from a database or API
  const proxim8: Proxim8Stats = {
    id: proxim8Id,
    name: proxim8Id.replace("-", " ").toUpperCase(),
    personality: "analytical",
    level: 3,
    experience: 450,
    nextLevelExp: 750,
    successRate: 78,
    specialization: "expose",
    missionCount: 5,
    status: "available",
    attributes: {
      intelligence: 75,
      stealth: 60,
      resilience: 55,
      influence: 40,
      adaptability: 65,
    },
    skills: [
      {
        name: "Quantum Encryption",
        level: 2,
        description: "Ability to bypass advanced security systems",
      },
      {
        name: "Neural Interface",
        level: 3,
        description: "Specialized in neural network infiltration",
      },
      {
        name: "Data Mining",
        level: 2,
        description: "Extract and analyze large datasets efficiently",
      },
    ],
    missionHistory: [
      {
        id: "mission-1",
        title: "Neural Interface Mandate",
        date: "June 2027",
        outcome: "success",
        approach: "expose",
        rewardXP: 150,
      },
      {
        id: "mission-2",
        title: "Consciousness Mapping Project",
        date: "August 2028",
        outcome: "failure",
        approach: "sabotage",
        rewardXP: 50,
      },
      {
        id: "mission-3",
        title: "Dream Monitoring Initiative",
        date: "May 2030",
        outcome: "success",
        approach: "expose",
        rewardXP: 180,
      },
    ],
  };

  useEffect(() => {
    // Scroll to bottom of chat when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // Add user message
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: messageInput },
    ]);

    // Clear input
    setMessageInput("");

    // Simulate Proxim8 response after a short delay
    setTimeout(() => {
      let response = "";

      // Simple keyword-based responses
      const lowercaseMessage = messageInput.toLowerCase();

      if (
        lowercaseMessage.includes("hello") ||
        lowercaseMessage.includes("hi")
      ) {
        response = "Hello, Handler. It's good to connect with you.";
      } else if (lowercaseMessage.includes("mission")) {
        response =
          "I'm ready to be deployed on a new mission. My analytical capabilities are optimized for expose operations, but I can adapt to other approaches as needed.";
      } else if (lowercaseMessage.includes("oneirocom")) {
        response =
          "Oneirocom's neural interface technology contains hidden monitoring capabilities. Their ultimate goal is consciousness control. We must disrupt their timeline.";
      } else if (lowercaseMessage.includes("help")) {
        response =
          "I can assist with mission planning, data analysis, and timeline interventions. What specific assistance do you need?";
      } else if (lowercaseMessage.includes("upgrade")) {
        response =
          "Upgrades to my systems would enhance my effectiveness. I recommend focusing on my neural interface capabilities for optimal mission performance.";
      } else {
        response =
          "I've processed your input. My analytical systems are ready to assist with your timeline intervention needs. The Green Loom awaits our contributions.";
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "proxim8", content: response },
      ]);
    }, 1000);
  };

  const getPersonalityIcon = () => {
    switch (proxim8.personality) {
      case "analytical":
        return <Brain className="h-5 w-5 text-blue-400" />;
      case "aggressive":
        return <Zap className="h-5 w-5 text-red-400" />;
      case "diplomatic":
        return <Users className="h-5 w-5 text-green-400" />;
    }
  };

  const getPersonalityColor = () => {
    switch (proxim8.personality) {
      case "analytical":
        return "border-blue-500 bg-blue-950/20";
      case "aggressive":
        return "border-red-500 bg-red-950/20";
      case "diplomatic":
        return "border-green-500 bg-green-950/20";
    }
  };

  const getPersonalityDescription = () => {
    switch (proxim8.personality) {
      case "analytical":
        return "Analytical Proxim8s excel at information gathering and strategic planning. They are particularly effective at EXPOSE missions, where they can identify and exploit weaknesses in Oneirocom's systems.";
      case "aggressive":
        return "Aggressive Proxim8s specialize in direct intervention and system disruption. They excel at SABOTAGE missions, where their high-risk approach can yield significant timeline shifts.";
      case "diplomatic":
        return "Diplomatic Proxim8s focus on building networks and influencing key individuals. They are most effective at ORGANIZE missions, creating lasting resistance movements.";
    }
  };

  const getApproachIcon = (approach: string) => {
    switch (approach) {
      case "sabotage":
        return <Zap className="h-4 w-4 text-red-400" />;
      case "expose":
        return <Brain className="h-4 w-4 text-blue-400" />;
      case "organize":
        return <Users className="h-4 w-4 text-green-400" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // If it's a full page, render a different layout optimized for both desktop and mobile
  if (isFullPage) {
    return (
      <div className="w-full">
        {/* Header Card */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center border-2",
                  getPersonalityColor()
                )}
              >
                {getPersonalityIcon()}
              </div>
              <div>
                <CardTitle className="text-2xl">{proxim8.name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-purple-900/20 text-purple-400">
                    Level {proxim8.level}
                  </Badge>
                  <Badge
                    className={cn(
                      proxim8.personality === "analytical"
                        ? "bg-blue-900/20 text-blue-400"
                        : proxim8.personality === "aggressive"
                          ? "bg-red-900/20 text-red-400"
                          : "bg-green-900/20 text-green-400"
                    )}
                  >
                    {proxim8.personality}
                  </Badge>
                  {proxim8.specialization && (
                    <Badge className="bg-yellow-900/20 text-yellow-400">
                      {proxim8.specialization} specialist
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="md:ml-auto flex items-center gap-2">
                <div className="text-sm text-gray-400">Experience:</div>
                <div className="flex-1 min-w-[150px]">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Level {proxim8.level}</span>
                    <span>
                      {proxim8.experience}/{proxim8.nextLevelExp} XP
                    </span>
                  </div>
                  <Progress
                    value={(proxim8.experience / proxim8.nextLevelExp) * 100}
                    className="h-2 bg-gray-800"
                    indicatorClassName="bg-purple-500"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 3D Viewer and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* 3D Viewer */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-0">
                <div className="h-[300px] md:h-[400px] bg-gray-950 relative">
                  <Proxim8Viewer personality={proxim8.personality} />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-black/50 hover:bg-black/70"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-black/50 hover:bg-black/70"
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-black/50 hover:bg-black/70"
                    >
                      <Dices className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(proxim8.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[1fr,auto,1fr] items-center gap-2"
                    >
                      <div className="text-xs capitalize">{key}</div>
                      <div className="text-xs font-mono text-purple-400">
                        {value}
                      </div>
                      <Progress
                        value={value}
                        className="h-1 bg-gray-800"
                        indicatorClassName="bg-purple-500"
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-yellow-400" />
                    Skills
                  </h3>
                  <div className="space-y-2">
                    {proxim8.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="bg-gray-800 p-2 rounded-md"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {skill.name}
                          </span>
                          <Badge className="bg-yellow-900/20 text-yellow-400">
                            Lvl {skill.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {skill.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Award className="h-4 w-4 mr-1 text-green-400" />
                    Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800 p-2 rounded-md">
                      <div className="text-xs text-gray-400">Success Rate</div>
                      <div className="text-lg font-bold text-green-400">
                        {proxim8.successRate}%
                      </div>
                    </div>
                    <div className="bg-gray-800 p-2 rounded-md">
                      <div className="text-xs text-gray-400">Missions</div>
                      <div className="text-lg font-bold">
                        {proxim8.missionCount}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardHeader className="pb-0">
                  <TabsList className="bg-gray-800 w-full justify-start">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-gray-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="data-[state=active]:bg-gray-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="data-[state=active]:bg-gray-700"
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger
                      value="customize"
                      className="data-[state=active]:bg-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  <TabsContent value="overview" className="m-0 space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-3">
                        Proxim8 Profile
                      </h2>
                      <div
                        className={cn(
                          "p-4 rounded-md border-2",
                          getPersonalityColor()
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getPersonalityIcon()}
                          <span className="font-medium capitalize">
                            {proxim8.personality} Personality
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {getPersonalityDescription()}
                        </p>
                      </div>
                    </div>

                    {proxim8.status === "deployed" && proxim8.mission && (
                      <div>
                        <h2 className="text-lg font-medium mb-3">
                          Current Mission
                        </h2>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <Badge
                                variant="outline"
                                className="bg-blue-900/20 text-blue-400"
                              >
                                {proxim8.mission.date}
                              </Badge>
                              <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                            </div>
                            <CardTitle className="text-base mt-2">
                              {proxim8.mission.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="text-xs text-gray-400 mb-3">
                              {proxim8.mission.description}
                            </div>
                            <div className="bg-gray-700 p-2 rounded-md">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Mission Progress</span>
                                <span>
                                  {proxim8.mission.missionEndTime
                                    ? Math.round(
                                        ((Date.now() -
                                          (proxim8.mission.missionEndTime -
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
                                  proxim8.mission.missionEndTime
                                    ? Math.round(
                                        ((Date.now() -
                                          (proxim8.mission.missionEndTime -
                                            2 * 60 * 1000)) /
                                          (2 * 60 * 1000)) *
                                          100
                                      )
                                    : 50
                                }
                                className="h-1 bg-gray-600"
                                indicatorClassName="bg-blue-400"
                              />
                              <div className="text-xs text-blue-300 mt-2">
                                "Infiltration successful. Analyzing security
                                protocols..."
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div>
                      <h2 className="text-lg font-medium mb-3">
                        Recent Activity
                      </h2>
                      <div className="space-y-3">
                        {proxim8.missionHistory.slice(0, 3).map((mission) => (
                          <div
                            key={mission.id}
                            className="bg-gray-800 p-3 rounded-md"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium">
                                  {mission.title}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {mission.date}
                                </div>
                              </div>
                              <Badge
                                className={
                                  mission.outcome === "success"
                                    ? "bg-green-900/20 text-green-400"
                                    : "bg-red-900/20 text-red-400"
                                }
                              >
                                {mission.outcome}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {getApproachIcon(mission.approach)}
                              <span className="capitalize">
                                {mission.approach}
                              </span>
                              <span className="text-purple-400 ml-auto">
                                +{mission.rewardXP} XP
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-xs"
                      >
                        View All <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>

                    <div>
                      <h2 className="text-lg font-medium mb-3">
                        Specialization
                      </h2>
                      {proxim8.specialization ? (
                        <div className="bg-yellow-900/20 border border-yellow-800 p-4 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            {getApproachIcon(proxim8.specialization)}
                            <span className="font-medium capitalize">
                              {proxim8.specialization} Specialist
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            This Proxim8 has specialized in{" "}
                            {proxim8.specialization} missions, gaining a +15%
                            success bonus when deployed on these mission types.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-800 p-4 rounded-md">
                          <p className="text-sm text-gray-300">
                            This Proxim8 has not yet developed a specialization.
                            Complete more missions of a specific type to develop
                            a specialization.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="m-0">
                    <div className="flex flex-col h-[500px]">
                      <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto space-y-4 mb-4"
                      >
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex",
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg p-3",
                                message.role === "user"
                                  ? "bg-green-900/30 text-green-50"
                                  : "bg-gray-800 text-gray-100"
                              )}
                            >
                              {message.role === "proxim8" && (
                                <div className="flex items-center gap-2 mb-1 text-xs text-blue-400">
                                  <Brain className="h-3 w-3" />
                                  <span>{proxim8.name}</span>
                                </div>
                              )}
                              <div className="text-sm">{message.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Message your Proxim8..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          className="bg-gray-800 border-gray-700"
                        />
                        <Button onClick={handleSendMessage}>Send</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="m-0 space-y-4">
                    <h2 className="text-lg font-medium mb-4">
                      Mission History
                    </h2>
                    <div className="space-y-4">
                      {proxim8.missionHistory.map((mission) => (
                        <Card
                          key={mission.id}
                          className="bg-gray-800 border-gray-700"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <Badge
                                variant="outline"
                                className="bg-transparent"
                              >
                                {mission.date}
                              </Badge>
                              <Badge
                                className={
                                  mission.outcome === "success"
                                    ? "bg-green-900/20 text-green-400"
                                    : "bg-red-900/20 text-red-400"
                                }
                              >
                                {mission.outcome}
                              </Badge>
                            </div>
                            <CardTitle className="text-base mt-2">
                              {mission.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 mb-3 text-sm">
                              {getApproachIcon(mission.approach)}
                              <span className="capitalize">
                                {mission.approach} approach
                              </span>
                            </div>
                            <div className="bg-gray-700 p-3 rounded-md">
                              <div className="text-xs text-gray-300 mb-2">
                                Mission Report:
                              </div>
                              <p className="text-sm">
                                {mission.outcome === "success"
                                  ? `Successfully disrupted ${mission.title} using ${mission.approach} tactics. Timeline shifted by approximately 3-5% toward Green Loom.`
                                  : `Attempted to disrupt ${mission.title} using ${mission.approach} tactics. Mission encountered unexpected resistance and was not successful.`}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t border-gray-700 pt-3">
                            <div className="flex justify-between items-center w-full">
                              <div className="text-xs text-purple-400">
                                Experience gained: +{mission.rewardXP} XP
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                              >
                                View Details
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="customize" className="m-0 space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">Appearance</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Card className="bg-gray-800 border-gray-700 border-2 border-green-500">
                          <CardContent className="p-3 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                            <div className="text-sm font-medium">Default</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-3 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                            <div className="text-sm font-medium">Stealth</div>
                            <Badge className="mt-1 bg-purple-900/20 text-purple-400">
                              Locked
                            </Badge>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-3 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                            <div className="text-sm font-medium">Tactical</div>
                            <Badge className="mt-1 bg-purple-900/20 text-purple-400">
                              Locked
                            </Badge>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h2 className="text-lg font-medium mb-4">Upgrades</h2>
                      <div className="space-y-3">
                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Brain className="h-4 w-4 text-blue-400" />
                                  <h3 className="font-medium">
                                    Neural Interface Upgrade
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">
                                  Enhance neural interface capabilities,
                                  improving success rate on expose missions by
                                  10%.
                                </p>
                              </div>
                              <Badge className="bg-green-900/20 text-green-400">
                                200 TP
                              </Badge>
                            </div>
                            <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                              <Wrench className="h-4 w-4 mr-2" /> Upgrade
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-purple-400" />
                                  <h3 className="font-medium">
                                    Quantum Encryption
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">
                                  Improve stealth capabilities with advanced
                                  quantum encryption, reducing detection risk by
                                  15%.
                                </p>
                              </div>
                              <Badge className="bg-green-900/20 text-green-400">
                                350 TP
                              </Badge>
                            </div>
                            <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                              <Wrench className="h-4 w-4 mr-2" /> Upgrade
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Cpu className="h-4 w-4 text-yellow-400" />
                                  <h3 className="font-medium">
                                    Memory Expansion
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">
                                  Increase experience gain from missions by 25%
                                  with enhanced memory systems.
                                </p>
                              </div>
                              <Badge className="bg-green-900/20 text-green-400">
                                275 TP
                              </Badge>
                            </div>
                            <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                              <Wrench className="h-4 w-4 mr-2" /> Upgrade
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Modal version (kept for backward compatibility)
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2",
                  getPersonalityColor()
                )}
              >
                {getPersonalityIcon()}
              </div>
              <div>
                <CardTitle className="text-xl">{proxim8.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge className="bg-purple-900/20 text-purple-400">
                    Level {proxim8.level}
                  </Badge>
                  <Badge
                    className={cn(
                      proxim8.personality === "analytical"
                        ? "bg-blue-900/20 text-blue-400"
                        : proxim8.personality === "aggressive"
                          ? "bg-red-900/20 text-red-400"
                          : "bg-green-900/20 text-green-400"
                    )}
                  >
                    {proxim8.personality}
                  </Badge>
                  {proxim8.specialization && (
                    <Badge className="bg-yellow-900/20 text-yellow-400">
                      {proxim8.specialization} specialist
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="flex flex-col md:flex-row">
          {/* Left Column - 3D Viewer */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800">
            <div className="h-[300px] bg-gray-950 relative">
              <Proxim8Viewer personality={proxim8.personality} />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/70"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/70"
                >
                  <Upload className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/70"
                >
                  <Dices className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 max-h-[calc(90vh-300px)] overflow-y-auto">
              {/* Experience Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Level {proxim8.level}</span>
                  <span>
                    {proxim8.experience}/{proxim8.nextLevelExp} XP
                  </span>
                </div>
                <Progress
                  value={(proxim8.experience / proxim8.nextLevelExp) * 100}
                  className="h-2 bg-gray-800"
                  indicatorClassName="bg-purple-500"
                />
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-purple-400" />
                    Attributes
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(proxim8.attributes).map(([key, value]) => (
                      <div
                        key={key}
                        className="grid grid-cols-[1fr,auto,1fr] items-center gap-2"
                      >
                        <div className="text-xs capitalize">{key}</div>
                        <div className="text-xs font-mono text-purple-400">
                          {value}
                        </div>
                        <Progress
                          value={value}
                          className="h-1 bg-gray-800"
                          indicatorClassName="bg-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-yellow-400" />
                    Skills
                  </h3>
                  <div className="space-y-2">
                    {proxim8.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="bg-gray-800 p-2 rounded-md"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {skill.name}
                          </span>
                          <Badge className="bg-yellow-900/20 text-yellow-400">
                            Lvl {skill.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {skill.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Award className="h-4 w-4 mr-1 text-green-400" />
                    Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800 p-2 rounded-md">
                      <div className="text-xs text-gray-400">Success Rate</div>
                      <div className="text-lg font-bold text-green-400">
                        {proxim8.successRate}%
                      </div>
                    </div>
                    <div className="bg-gray-800 p-2 rounded-md">
                      <div className="text-xs text-gray-400">Missions</div>
                      <div className="text-lg font-bold">
                        {proxim8.missionCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="flex-1 flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <div className="border-b border-gray-800">
                <TabsList className="bg-transparent border-b border-gray-800 rounded-none h-12 w-full justify-start">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-gray-800"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="data-[state=active]:bg-gray-800"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-gray-800"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                  <TabsTrigger
                    value="customize"
                    className="data-[state=active]:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="overview"
                className="flex-1 p-6 overflow-y-auto m-0 border-none"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium mb-3">
                      Proxim8 Profile
                    </h2>
                    <div
                      className={cn(
                        "p-4 rounded-md border-2",
                        getPersonalityColor()
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getPersonalityIcon()}
                        <span className="font-medium capitalize">
                          {proxim8.personality} Personality
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {getPersonalityDescription()}
                      </p>
                    </div>
                  </div>

                  {proxim8.status === "deployed" && proxim8.mission && (
                    <div>
                      <h2 className="text-lg font-medium mb-3">
                        Current Mission
                      </h2>
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <Badge
                              variant="outline"
                              className="bg-blue-900/20 text-blue-400"
                            >
                              {proxim8.mission.date}
                            </Badge>
                            <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                          </div>
                          <CardTitle className="text-base mt-2">
                            {proxim8.mission.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-xs text-gray-400 mb-3">
                            {proxim8.mission.description}
                          </div>
                          <div className="bg-gray-700 p-2 rounded-md">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Mission Progress</span>
                              <span>
                                {proxim8.mission.missionEndTime
                                  ? Math.round(
                                      ((Date.now() -
                                        (proxim8.mission.missionEndTime -
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
                                proxim8.mission.missionEndTime
                                  ? Math.round(
                                      ((Date.now() -
                                        (proxim8.mission.missionEndTime -
                                          2 * 60 * 1000)) /
                                        (2 * 60 * 1000)) *
                                        100
                                    )
                                  : 50
                              }
                              className="h-1 bg-gray-600"
                              indicatorClassName="bg-blue-400"
                            />
                            <div className="text-xs text-blue-300 mt-2">
                              "Infiltration successful. Analyzing security
                              protocols..."
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div>
                    <h2 className="text-lg font-medium mb-3">
                      Recent Activity
                    </h2>
                    <div className="space-y-3">
                      {proxim8.missionHistory.slice(0, 3).map((mission) => (
                        <div
                          key={mission.id}
                          className="bg-gray-800 p-3 rounded-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">
                                {mission.title}
                              </div>
                              <div className="text-xs text-gray-400">
                                {mission.date}
                              </div>
                            </div>
                            <Badge
                              className={
                                mission.outcome === "success"
                                  ? "bg-green-900/20 text-green-400"
                                  : "bg-red-900/20 text-red-400"
                              }
                            >
                              {mission.outcome}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            {getApproachIcon(mission.approach)}
                            <span className="capitalize">
                              {mission.approach}
                            </span>
                            <span className="text-purple-400 ml-auto">
                              +{mission.rewardXP} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3 text-xs">
                      View All <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <h2 className="text-lg font-medium mb-3">Specialization</h2>
                    {proxim8.specialization ? (
                      <div className="bg-yellow-900/20 border border-yellow-800 p-4 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          {getApproachIcon(proxim8.specialization)}
                          <span className="font-medium capitalize">
                            {proxim8.specialization} Specialist
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          This Proxim8 has specialized in{" "}
                          {proxim8.specialization} missions, gaining a +15%
                          success bonus when deployed on these mission types.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-800 p-4 rounded-md">
                        <p className="text-sm text-gray-300">
                          This Proxim8 has not yet developed a specialization.
                          Complete more missions of a specific type to develop a
                          specialization.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="chat"
                className="flex-1 flex flex-col m-0 border-none"
              >
                <div
                  ref={chatContainerRef}
                  className="flex-1 p-4 overflow-y-auto space-y-4"
                >
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === "user"
                            ? "bg-green-900/30 text-green-50"
                            : "bg-gray-800 text-gray-100"
                        )}
                      >
                        {message.role === "proxim8" && (
                          <div className="flex items-center gap-2 mb-1 text-xs text-blue-400">
                            <Brain className="h-3 w-3" />
                            <span>{proxim8.name}</span>
                          </div>
                        )}
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Message your Proxim8..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="bg-gray-800 border-gray-700"
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="history"
                className="flex-1 p-6 overflow-y-auto m-0 border-none"
              >
                <h2 className="text-lg font-medium mb-4">Mission History</h2>
                <div className="space-y-4">
                  {proxim8.missionHistory.map((mission) => (
                    <Card
                      key={mission.id}
                      className="bg-gray-800 border-gray-700"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="bg-transparent">
                            {mission.date}
                          </Badge>
                          <Badge
                            className={
                              mission.outcome === "success"
                                ? "bg-green-900/20 text-green-400"
                                : "bg-red-900/20 text-red-400"
                            }
                          >
                            {mission.outcome}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">
                          {mission.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          {getApproachIcon(mission.approach)}
                          <span className="capitalize">
                            {mission.approach} approach
                          </span>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-md">
                          <div className="text-xs text-gray-300 mb-2">
                            Mission Report:
                          </div>
                          <p className="text-sm">
                            {mission.outcome === "success"
                              ? `Successfully disrupted ${mission.title} using ${mission.approach} tactics. Timeline shifted by approximately 3-5% toward Green Loom.`
                              : `Attempted to disrupt ${mission.title} using ${mission.approach} tactics. Mission encountered unexpected resistance and was not successful.`}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-gray-700 pt-3">
                        <div className="flex justify-between items-center w-full">
                          <div className="text-xs text-purple-400">
                            Experience gained: +{mission.rewardXP} XP
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View Details
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent
                value="customize"
                className="flex-1 p-6 overflow-y-auto m-0 border-none"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium mb-4">Appearance</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Card className="bg-gray-800 border-gray-700 border-2 border-green-500">
                        <CardContent className="p-3 flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                          <div className="text-sm font-medium">Default</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-3 flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                          <div className="text-sm font-medium">Stealth</div>
                          <Badge className="mt-1 bg-purple-900/20 text-purple-400">
                            Locked
                          </Badge>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-3 flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                          <div className="text-sm font-medium">Tactical</div>
                          <Badge className="mt-1 bg-purple-900/20 text-purple-400">
                            Locked
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-lg font-medium mb-4">Upgrades</h2>
                    <div className="space-y-3">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-blue-400" />
                                <h3 className="font-medium">
                                  Neural Interface Upgrade
                                </h3>
                              </div>
                              <p className="text-sm text-gray-300 mt-1">
                                Enhance neural interface capabilities, improving
                                success rate on expose missions by 10%.
                              </p>
                            </div>
                            <Badge className="bg-green-900/20 text-green-400">
                              200 TP
                            </Badge>
                          </div>
                          <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                            <Wrench className="h-4 w-4 mr-2" /> Upgrade
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-400" />
                                <h3 className="font-medium">
                                  Quantum Encryption
                                </h3>
                              </div>
                              <p className="text-sm text-gray-300 mt-1">
                                Improve stealth capabilities with advanced
                                quantum encryption, reducing detection risk by
                                15%.
                              </p>
                            </div>
                            <Badge className="bg-green-900/20 text-green-400">
                              350 TP
                            </Badge>
                          </div>
                          <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                            <Wrench className="h-4 w-4 mr-2" /> Upgrade
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-yellow-400" />
                                <h3 className="font-medium">
                                  Memory Expansion
                                </h3>
                              </div>
                              <p className="text-sm text-gray-300 mt-1">
                                Increase experience gain from missions by 25%
                                with enhanced memory systems.
                              </p>
                            </div>
                            <Badge className="bg-green-900/20 text-green-400">
                              275 TP
                            </Badge>
                          </div>
                          <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-black">
                            <Wrench className="h-4 w-4 mr-2" /> Upgrade
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Card>
    </div>
  );
}
