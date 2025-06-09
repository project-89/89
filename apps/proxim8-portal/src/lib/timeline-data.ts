export type EventStatus =
  | "active"
  | "locked"
  | "completed-success"
  | "completed-failure"
  | "contested"
  | "in-progress";
export type Approach = "sabotage" | "expose" | "organize";
export type TimelinePeriod = "early" | "mid" | "late";

export interface TimelineEvent {
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
  imageUrl?: string;
  videoUrl?: string;
  selectedApproach?: string;
  selectedAgent?: string;
}


// Generate sample data with 30+ missions
export const generateTimelineEvents = (): TimelineEvent[] => {
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

  // Add a completed success mission
  events.push({
    id: "event4",
    date: "January 2026",
    year: 2026,
    title: "Neural Data Privacy Rollback",
    status: "completed-success",
    oneirocumControl: 45,
    description:
      "Attempt to remove privacy protections for neural interface data.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 53,
    isExpanded: false,
    period: "early",
    briefing:
      "The Neural Data Privacy Rollback was an attempt by Oneirocom to remove key privacy protections for neural interface data. Your successful intervention preserved critical privacy safeguards.",
  });

  // Add a completed failure mission
  events.push({
    id: "event5",
    date: "August 2028",
    year: 2028,
    title: "Consciousness Mapping Project",
    status: "completed-failure",
    oneirocumControl: 82,
    description:
      "Classified research program to map and categorize consciousness patterns.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 19,
    isExpanded: false,
    period: "early",
    briefing:
      "The Consciousness Mapping Project was a classified research program designed to map and categorize consciousness patterns. Despite our intervention attempt, the project proceeded as planned.",
  });

  // Add an in-progress mission
  events.push({
    id: "event6",
    date: "May 2030",
    year: 2030,
    title: "Dream Monitoring Initiative",
    status: "in-progress",
    oneirocumControl: 70,
    description:
      "Technology to monitor and record dream content through neural interfaces.",
    approaches: ["sabotage", "expose", "organize"],
    agentsActive: 41,
    isExpanded: false,
    period: "early",
    missionEndTime: Date.now() + 2 * 60 * 1000, // 2 minutes from now
    briefing:
      "The Dream Monitoring Initiative introduces technology to monitor and record dream content through neural interfaces. This represents a significant invasion of the last private human space - the unconscious mind.",
  });

  // Add more early period events
  for (let year = 2032; year <= 2035; year++) {
    events.push({
      id: `event-early-${year}`,
      date: `${["January", "April", "July", "October"][Math.floor(Math.random() * 4)]} ${year}`,
      year,
      title: [
        "Neural Interface Standards",
        "Synthetic Experience Marketplace",
        "Thought Pattern Standardization",
        "Consciousness Encryption Ban",
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
        "Mandatory Dream Reporting",
        "Neural Compliance Enforcement",
        "Thought Crime Legislation",
        "Consciousness Unification Protocol",
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
        "Autonomous Thought Elimination",
        "Reality Perception Standardization",
        "Final Consciousness Integration",
        "Oneirocom Singularity",
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
