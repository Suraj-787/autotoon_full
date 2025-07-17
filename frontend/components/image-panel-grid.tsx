"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ZoomIn, Download } from "lucide-react"

interface ImagePanelGridProps {
  images: string[]
}

export function ImagePanelGrid({ images }: ImagePanelGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleDownloadImage = (imageUrl: string, index: number) => {
    // In a real app, this would download the actual image
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `panel-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={`image-panel-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="overflow-hidden panel-shadow hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="relative group">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Comic panel ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" onClick={() => setSelectedImage(image)}>
                          <ZoomIn className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogTitle className="sr-only">Comic Panel {index + 1} - Full View</DialogTitle>
                        <div className="relative">
                          <Image
                            src={selectedImage || image}
                            alt={`Comic panel ${index + 1} - Full size`}
                            width={800}
                            height={600}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" variant="secondary" onClick={() => handleDownloadImage(image, index)}>
                      <Download className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>

                  {/* Panel Number */}
                  <Badge variant="secondary" className="absolute top-2 left-2 bg-white/90 text-black">
                    Panel {index + 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No panels generated yet. Please wait for the generation to complete.</p>
        </div>
      )}
    </div>
  )
}
