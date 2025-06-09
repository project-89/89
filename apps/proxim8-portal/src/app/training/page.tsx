import { Metadata } from "next";
import TrainingPageClient from "./TrainingPageClient";

export const metadata: Metadata = {
  title: "Training Missions - Project 89",
  description: "Begin your journey as a Project 89 agent. Complete training missions to learn timeline manipulation.",
};

export default function TrainingPage() {
  return <TrainingPageClient />;
}