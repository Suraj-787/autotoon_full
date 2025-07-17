"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface StoryInputFormProps {
  value: string
  onChange: (value: string) => void
}

export function StoryInputForm({ value, onChange }: StoryInputFormProps) {
  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="story" className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Your Story
            </Label>
            <span className="text-sm text-muted-foreground">{wordCount} words</span>
          </div>

          <Textarea
            id="story"
            placeholder="Enter your story here... 

Example: 
Once upon a time, in a magical forest, there lived a brave young fox named Luna. She had bright orange fur and sparkling green eyes. One day, Luna discovered a mysterious glowing crystal hidden beneath an ancient oak tree. As she touched it, the crystal began to pulse with magical energy, and Luna realized she had found something extraordinary that would change her life forever..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[300px] resize-none text-base leading-relaxed"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Recommended: 100-500 words</span>
            <span
              className={wordCount > 500 ? "text-orange-500" : wordCount < 100 ? "text-blue-500" : "text-green-500"}
            >
              {wordCount < 100 ? "Add more details" : wordCount > 500 ? "Consider shortening" : "Perfect length!"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
