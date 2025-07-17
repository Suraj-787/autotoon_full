"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImagePanelGrid } from "@/components/image-panel-grid"
import { FileText, Palette, MessageSquare, ImageIcon, CheckCircle, Clock } from "lucide-react"

interface PanelStepViewerProps {
  generationId: string
  story: string
  style: string
  currentStep: number
  onStepChange: (step: number) => void
  generationData?: {
    scenes?: string[]
    styleGuide?: string
    prompts?: string[]
    images?: string[]
  }
}

export function PanelStepViewer({ generationId, story, style, currentStep, onStepChange, generationData }: PanelStepViewerProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // Use actual generation data if available, otherwise fall back to mock data
  const scenes = generationData?.scenes || [
    "Luna the fox discovers the glowing crystal",
    "The crystal pulses with magical energy",
    "Luna's transformation begins",
    "The forest responds to the magic",
  ]

  const styleGuide = generationData?.styleGuide || `## Style Guide\n
**Characters:** Luna - Orange fox with green eyes, Ancient Oak Tree, Magical Crystal\n
**Mood:** Mystical and adventurous\n
**Colors:** Vibrant forest colors with magical elements`

  const prompts = generationData?.prompts || [
    "A brave young fox with bright orange fur and sparkling green eyes standing in a magical forest",
    "Close-up of a mysterious glowing crystal hidden beneath an ancient oak tree",
    "The fox touching the crystal as it pulses with magical energy, creating sparkles around them",
    "Wide shot of the magical forest responding to the crystal's power with glowing plants and floating lights",
  ]

  const images = generationData?.images || [
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
  ]

  // Convert relative URLs to full URLs for the backend
  const fullImageUrls = images.map(img => {
    if (img.startsWith('/images/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}${img}`
    }
    return img
  })

  useEffect(() => {
    // Simulate step completion
    const timer = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev.length < 4) {
          return [...prev, prev.length]
        }
        clearInterval(timer)
        return prev
      })
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  const steps = [
    {
      id: "scenes",
      title: "Scene Breakdown",
      icon: FileText,
      description: "Story divided into visual scenes",
    },
    {
      id: "style-guide",
      title: "Style Guide",
      icon: Palette,
      description: "Visual style and character design",
    },
    {
      id: "prompts",
      title: "Panel Prompts",
      icon: MessageSquare,
      description: "AI prompts for each panel",
    },
    {
      id: "images",
      title: "Panel Previews",
      icon: ImageIcon,
      description: "Generated comic panels",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Generation Process
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={steps[currentStep]?.id}
          onValueChange={(value) => {
            const stepIndex = steps.findIndex((step) => step.id === value)
            if (stepIndex !== -1) onStepChange(stepIndex)
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = completedSteps.includes(index)
              const isCurrent = currentStep === index

              return (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  className="flex items-center gap-2 text-xs"
                  disabled={!isCompleted && !isCurrent}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : isCurrent ? (
                    <Clock className="h-3 w-3 animate-pulse text-blue-500" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="mt-6">
              <TabsContent value="scenes" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4">Scene Breakdown</h3>
                  <div className="space-y-3">
                    {scenes.map((scene: string, index: number) => (
                      <div key={`scene-${index}`} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Badge variant="outline" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <p className="text-sm">{scene}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="style-guide" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4">Style Guide</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Style Description</h4>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">
                          {styleGuide}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="prompts" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4">Panel Prompts</h3>
                  <div className="space-y-3">
                    {prompts.map((prompt: string, index: number) => (
                      <Card key={`prompt-${index}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline">Panel {index + 1}</Badge>
                            <p className="text-sm flex-1">{prompt}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4">Generated Panels</h3>
                  <ImagePanelGrid images={fullImageUrls} />
                </motion.div>
              </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
