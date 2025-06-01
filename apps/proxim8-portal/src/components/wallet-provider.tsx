"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface WalletContextType {
  connected: boolean
  address: string | null
  connect: () => void
  disconnect: () => void
  hasProxim8: boolean
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
  hasProxim8: false,
})

export const useWallet = () => useContext(WalletContext)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [hasProxim8, setHasProxim8] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const connect = () => {
    // Simulate wallet connection
    setConnected(true)
    setAddress("0x1234...5678")
    setHasProxim8(true)

    // Show onboarding for first-time users
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
      localStorage.setItem("hasSeenOnboarding", "true")
    }
  }

  const disconnect = () => {
    setConnected(false)
    setAddress(null)
  }

  const closeOnboarding = () => {
    setShowOnboarding(false)
  }

  return (
    <WalletContext.Provider value={{ connected, address, connect, disconnect, hasProxim8 }}>
      {!connected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Project 89: Timeline Intervention</h2>
            <p className="mb-6 text-gray-300">
              Connect your wallet to join the resistance and deploy your Proxim8 to hack the timeline.
            </p>
            <Button onClick={connect} className="w-full bg-green-600 hover:bg-green-700 text-black">
              Connect Wallet
            </Button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-50">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Welcome to the Resistance</h2>
            <div className="aspect-video bg-black mb-6 rounded-md flex items-center justify-center border border-gray-800">
              <p className="text-center text-gray-400">
                [Training Video: Anime-style introduction to Operation Timeline]
              </p>
            </div>
            <div className="mb-6 border-l-4 border-green-500 pl-4">
              <p className="italic text-gray-300">
                "Agent, you've been chosen for Operation Timeline. In the year 2089, the mega-corporation Oneirocom
                achieves total dominance over human consciousness. But this future isn't inevitable—it's engineered."
              </p>
              <p className="italic text-gray-300 mt-2">
                "With your Proxim8, you can hack Oneirocom's predetermined future. Every mission you deploy disrupts
                their timeline. Together, we can weave the Green Loom—a future where consciousness is free."
              </p>
              <p className="text-right text-green-500 mt-2">- Seraph</p>
            </div>
            <Button onClick={closeOnboarding} className="w-full bg-green-600 hover:bg-green-700 text-black">
              Begin Your Mission
            </Button>
          </div>
        </div>
      )}

      {children}
    </WalletContext.Provider>
  )
}
