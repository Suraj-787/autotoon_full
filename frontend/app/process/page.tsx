"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { PanelStepViewer } from "@/components/panel-step-viewer"
import { DownloadButton } from "@/components/download-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import type { GenerationData } from "@/lib/api"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function ProcessPage() {
  const [currentGeneration, setCurrentGeneration] = useState<GenerationData | null>(null)
  const [currentStep, setCurrentStep] = useState(4) // Show final results
  const [progress, setProgress] = useState(100) // Complete
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Load current generation from localStorage
    const stored = localStorage.getItem("currentGeneration")
    if (!stored) {
      toast({
        title: "No Generation Found",
        description: "Please start a new comic generation.",
        variant: "destructive",
      })
      router.push("/create")
      return
    }

    const data = JSON.parse(stored)
    setCurrentGeneration(data)
    setIsLoading(false)

    // Show completion immediately since we have all data
    setProgress(100)
    setCurrentStep(4)
  }, [router, toast])

  const handleStartOver = () => {
    localStorage.removeItem("currentGeneration")
    router.push("/create")
  }

  if (isLoading || !currentGeneration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading generation data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Comic Generation</h1>
            <p className="text-muted-foreground">
              Style: {currentGeneration.style} • Generated: {new Date(currentGeneration.timestamp).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" onClick={handleStartOver} className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Generation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {progress < 100 ? `Processing... ${progress}%` : "Generation Complete!"}
            </p>
          </CardContent>
        </Card>

        {/* Step Viewer */}
        <PanelStepViewer
          generationId={currentGeneration.sessionId || currentGeneration.id}
          story={currentGeneration.story}
          style={currentGeneration.style}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          generationData={{
            scenes: currentGeneration.scenes,
            styleGuide: currentGeneration.styleGuide,
            prompts: currentGeneration.prompts,
            images: currentGeneration.images
          }}
        />

        {/* Action Buttons */}
        {progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center gap-4 mt-8"
          >
            <DownloadButton generationId={currentGeneration.id} />
            <Button variant="outline" onClick={handleStartOver} size="lg">
              Create Another Comic
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
