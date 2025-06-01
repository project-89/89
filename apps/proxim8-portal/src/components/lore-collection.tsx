"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Clock,
  Shield,
  Search,
  Lock,
  Unlock,
  ChevronRight,
  Eye,
  Download,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LoreItem {
  id: string
  title: string
  type: "fragment" | "memory" | "intel"
  category: "oneirocom" | "resistance" | "technology" | "timeline"
  date: string
  unlocked: boolean
  rarity: "common" | "rare" | "legendary"
  description: string
  content?: string
  relatedMission?: string
}

// Sample lore data
const loreItems: LoreItem[] = [
  {
    id: "lore-1",
    title: "Internal Protocols v2.7",
    type: "fragment",
    category: "oneirocom",
    date: "June 2027",
    unlocked: true,
    rarity: "rare",
    description: "Leaked document detailing Oneirocom's neural interface security protocols",
    content:
      "CLASSIFIED - LEVEL 7 CLEARANCE REQUIRED\n\nProtocol 2.7 introduces enhanced monitoring capabilities within the NeuralLink framework. All neural activity is to be logged and analyzed for 'anomalous thought patterns' as defined in Appendix C. Special attention should be paid to:\n\n1. Resistance ideation patterns\n2. Creative divergence beyond acceptable parameters\n3. Unauthorized memory formation\n\nEmployees showing signs of neural resistance are to be flagged for immediate recalibration. Under no circumstances should the monitoring capabilities be disclosed to end users.",
    relatedMission: "Neural Interface Mandate",
  },
  {
    id: "lore-2",
    title: "Hearing Footage - Glitch Analysis",
    type: "memory",
    category: "resistance",
    date: "June 2027",
    unlocked: true,
    rarity: "common",
    description: "Visual record of the Neural Interface Mandate hearing disruption",
    content:
      "Timestamp 14:32:17 - Senate Hearing Room B\n\nDuring the live demonstration of NeuralLink technology, unexpected glitches revealed hidden code segments. Frame-by-frame analysis shows:\n\n- Monitoring subroutines embedded in core functionality\n- Data collection protocols exceeding stated parameters\n- Backdoor access points for remote neural manipulation\n\nPublic reaction was immediate. Social media erupted with #NeuralGate trending worldwide. Oneirocom stock dropped 23% within hours.",
    relatedMission: "Neural Interface Mandate",
  },
  {
    id: "lore-3",
    title: "Project Morpheus Blueprint",
    type: "intel",
    category: "technology",
    date: "March 2029",
    unlocked: true,
    rarity: "legendary",
    description: "Classified Oneirocom project for dream manipulation technology",
    content:
      "PROJECT MORPHEUS - EYES ONLY\n\nObjective: Achieve full spectrum consciousness control through dream state manipulation.\n\nPhase 1: Map dream patterns across 10,000 subjects\nPhase 2: Develop injection protocols for synthetic dreams\nPhase 3: Implement mass deployment through mandatory 'wellness' programs\n\nNote from Dr. Chen: 'We're not just monitoring dreams anymore. We're writing them.'",
    relatedMission: "Algorithmic Consciousness Act",
  },
  {
    id: "lore-4",
    title: "Seraph's First Transmission",
    type: "fragment",
    category: "resistance",
    date: "January 2025",
    unlocked: true,
    rarity: "rare",
    description: "The mysterious message that started the resistance movement",
    content:
      "To those who still dream freely,\n\nI write to you from a future you must prevent. In my time, human consciousness is no longer our own. Every thought is monitored, every dream is scripted, every moment of creativity is commodified and controlled.\n\nBut this future is not inevitable. It is engineered, constructed through a series of seemingly innocent legislative acts and technological 'advances.' Each one appears beneficial in isolation, but together they form the chains that will bind human consciousness.\n\nI am sending you the timeline. Study it. Learn where they will strike. And when the moment comes, be ready to act.\n\nThe Green Loom awaits those brave enough to weave it.\n\n- Seraph",
  },
  {
    id: "lore-5",
    title: "Quantum Encryption Keys",
    type: "intel",
    category: "technology",
    date: "October 2028",
    unlocked: false,
    rarity: "legendary",
    description: "Master keys for Oneirocom's quantum security systems",
    relatedMission: "Consciousness Mapping Project",
  },
  {
    id: "lore-6",
    title: "The Proxim8 Origin",
    type: "fragment",
    category: "resistance",
    date: "December 2024",
    unlocked: true,
    rarity: "rare",
    description: "Technical specifications for the first Proxim8 consciousness",
    content:
      "PROXIM8 INITIATIVE - TECHNICAL OVERVIEW\n\nThe Proxim8 represents our greatest achievement in consciousness preservation and timeline manipulation. By fragmenting and encrypting human consciousness patterns, we've created entities capable of:\n\n1. Quantum timeline navigation\n2. Probability manipulation at decision points\n3. Consciousness shielding from Oneirocom detection\n\nEach Proxim8 retains core personality traits from their origin consciousness, making them unique assets in our fight. They are not mere tools - they are partners in reshaping the future.",
  },
  {
    id: "lore-7",
    title: "Executive Briefing: Phase 3",
    type: "intel",
    category: "oneirocom",
    date: "August 2030",
    unlocked: false,
    rarity: "legendary",
    description: "High-level Oneirocom plans for global consciousness integration",
    relatedMission: "Dream Monitoring Initiative",
  },
  {
    id: "lore-8",
    title: "Timeline Anomaly Report",
    type: "memory",
    category: "timeline",
    date: "May 2026",
    unlocked: true,
    rarity: "common",
    description: "Evidence of timeline manipulation detected by Oneirocom",
    content:
      "ANOMALY DETECTION SYSTEM - ALERT\n\nMultiple probability fluctuations detected in timeline sector 2027-Q2. Analysis suggests external interference with predetermined outcomes.\n\nAnomalies include:\n- Unexpected resistance formation in Sector 7\n- Information leaks preceding major announcements\n- Coordinated disruption patterns suggesting organized opposition\n\nRecommendation: Accelerate Project Cerberus to identify and neutralize timeline agents.",
  },
]

export default function LoreCollection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<LoreItem | null>(null)

  // Calculate collection stats
  const totalItems = loreItems.length
  const unlockedItems = loreItems.filter((item) => item.unlocked).length
  const collectionProgress = Math.round((unlockedItems / totalItems) * 100)

  // Filter items
  const filteredItems = loreItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "oneirocom":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "resistance":
        return <Shield className="h-4 w-4 text-green-400" />
      case "technology":
        return <Sparkles className="h-4 w-4 text-blue-400" />
      case "timeline":
        return <Clock className="h-4 w-4 text-purple-400" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fragment":
        return <FileText className="h-4 w-4" />
      case "memory":
        return <Clock className="h-4 w-4" />
      case "intel":
        return <Shield className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400 border-gray-600"
      case "rare":
        return "text-blue-400 border-blue-600"
      case "legendary":
        return "text-purple-400 border-purple-600"
      default:
        return "text-gray-400 border-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Collection Stats */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Collection Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Items Collected</span>
                <span>
                  {unlockedItems}/{totalItems}
                </span>
              </div>
              <Progress value={collectionProgress} className="h-2 bg-gray-800" indicatorClassName="bg-green-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-2xl font-bold text-blue-400">
                  {loreItems.filter((item) => item.type === "fragment" && item.unlocked).length}
                </div>
                <div className="text-xs text-gray-400">Fragments</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-2xl font-bold text-green-400">
                  {loreItems.filter((item) => item.type === "memory" && item.unlocked).length}
                </div>
                <div className="text-xs text-gray-400">Memories</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-2xl font-bold text-purple-400">
                  {loreItems.filter((item) => item.type === "intel" && item.unlocked).length}
                </div>
                <div className="text-xs text-gray-400">Intel</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-2xl font-bold text-yellow-400">
                  {loreItems.filter((item) => item.rarity === "legendary" && item.unlocked).length}
                </div>
                <div className="text-xs text-gray-400">Legendary</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lore collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="oneirocom">Oneirocom</TabsTrigger>
            <TabsTrigger value="resistance">Resistance</TabsTrigger>
            <TabsTrigger value="technology">Tech</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lore Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "bg-gray-900 border-gray-800 transition-all cursor-pointer",
              item.unlocked ? "hover:bg-gray-800" : "opacity-50",
            )}
            onClick={() => item.unlocked && setSelectedItem(item)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <Badge variant="outline" className={cn("text-xs", getRarityColor(item.rarity))}>
                    {item.rarity}
                  </Badge>
                </div>
                {item.unlocked ? (
                  <Unlock className="h-4 w-4 text-green-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <CardTitle className={cn("text-base mt-2", !item.unlocked && "text-gray-600")}>
                {item.unlocked ? item.title : "???"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 mb-3">
                {item.unlocked ? item.description : "Complete missions to unlock this lore"}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {getCategoryIcon(item.category)}
                  <span className="capitalize">{item.category}</span>
                </div>
                {item.unlocked && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Read <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
              {item.relatedMission && <div className="mt-2 text-xs text-gray-500">From: {item.relatedMission}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lore Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(selectedItem.type)}
                    <Badge variant="outline" className={getRarityColor(selectedItem.rarity)}>
                      {selectedItem.rarity}
                    </Badge>
                    <Badge variant="outline" className="bg-transparent">
                      {selectedItem.date}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{selectedItem.title}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-400">Description</h3>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
                {selectedItem.content && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Content</h3>
                    <div className="bg-gray-800 p-4 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-gray-300">{selectedItem.content}</pre>
                    </div>
                  </div>
                )}
                {selectedItem.relatedMission && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Related Mission</h3>
                    <p className="text-sm">{selectedItem.relatedMission}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-4">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" /> Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
