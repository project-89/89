"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Proxim8Dashboard from "@/components/proxim8-dashboard"

export default function Proxim8Page({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading the Proxim8 data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-pulse text-green-400">Loading Proxim8 data...</div>
          </div>
        ) : (
          <Proxim8Dashboard proxim8Id={params.id} isFullPage />
        )}
      </div>
    </div>
  )
}
