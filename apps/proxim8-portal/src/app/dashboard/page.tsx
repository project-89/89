import AgentDashboard from "@/components/agent-dashboard"
import { WalletProvider } from "@/components/wallet-provider"

export default function Dashboard() {
  return (
    <WalletProvider>
      <main className="min-h-screen bg-black text-gray-200">
        <AgentDashboard />
      </main>
    </WalletProvider>
  )
}
