"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Palette } from "lucide-react"

const comicStyles = [
  { value: "2d-flat", label: "2D Flat", description: "Clean, modern flat design style" },
  { value: "manga", label: "Manga", description: "Japanese comic book style" },
  { value: "watercolor", label: "Watercolor", description: "Soft, artistic watercolor painting" },
  { value: "ink", label: "Ink", description: "Bold black and white ink drawings" },
  { value: "cartoon", label: "Cartoon", description: "Colorful animated cartoon style" },
  { value: "realistic", label: "Realistic", description: "Photorealistic comic style" },
  { value: "vintage", label: "Vintage", description: "Classic retro comic book style" },
  { value: "minimalist", label: "Minimalist", description: "Simple, clean line art" },
]

interface StyleSelectorDropdownProps {
  value: string
  onChange: (value: string) => void
}

export function StyleSelectorDropdown({ value, onChange }: StyleSelectorDropdownProps) {
  const selectedStyle = comicStyles.find((style) => style.value === value)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Comic Style
          </Label>

          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a comic style" />
            </SelectTrigger>
            <SelectContent>
              {comicStyles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStyle && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-medium">{selectedStyle.label}:</span> {selectedStyle.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
