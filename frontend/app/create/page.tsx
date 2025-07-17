"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { StoryInputForm } from "@/components/story-input-form"
import { StyleSelectorDropdown } from "@/components/style-selector-dropdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { generateCompleteComic } from "@/lib/api"
import { Loader2, Wand2 } from "lucide-react"

export default function CreatePage() {
  const [story, setStory] = useState("")
  const [style, setStyle] = useState("2d-flat")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!story.trim()) {
      toast({
        title: "Story Required",
        description: "Please enter a story before generating your comic.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await generateCompleteComic({ story, style })

      // Store the complete generation data for the process page
      localStorage.setItem(
        "currentGeneration",
        JSON.stringify({
          sessionId: result.sessionId,
          story,
          style,
          scenes: result.scenes,
          styleGuide: result.styleGuide,
          prompts: result.prompts,
          images: result.images,
          timestamp: Date.now(),
        }),
      )

      toast({
        title: "Comic Generated Successfully!",
        description: "Your comic has been created. Redirecting to view page...",
      })

      // Redirect to process page
      setTimeout(() => {
        router.push("/process")
      }, 1000)
    } catch (error) {
      console.error("Generation failed:", error)
      toast({
        title: "Generation Failed",
        description: "There was an error generating your comic. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Create Your Comic</h1>
          <p className="text-lg text-muted-foreground">Enter your story and choose a style to generate your AI comic</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Story & Style Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Your Story</h3>
              <StoryInputForm value={story} onChange={setStory} />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Comic Style</h3>
              <StyleSelectorDropdown value={style} onChange={setStyle} />
            </div>

            <Separator />

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !story.trim()}
                size="lg"
                className="px-8 py-6 text-lg comic-gradient text-white hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Comic...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Comic
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Better Comics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep your story between 100-500 words for best results</li>
                <li>• Include character descriptions and dialogue</li>
                <li>• Describe key scenes and emotions clearly</li>
                <li>• Try different styles to see what works best for your story</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
