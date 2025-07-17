"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Trash2, Calendar, Palette } from "lucide-react"

interface Comic {
  id: string
  title: string
  style: string
  thumbnail: string
  createdAt: number
  story: string
}

interface ComicCardProps {
  comic: Comic
  onView: (comic: Comic) => void
  onDelete: (id: string) => void
}

export function ComicCard({ comic, onView, onDelete }: ComicCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStoryPreview = (story: string) => {
    return story.length > 100 ? story.substring(0, 100) + "..." : story
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-0">
          <div className="relative">
            <Image
              src={comic.thumbnail || "/placeholder.svg?height=200&width=300"}
              alt={comic.title}
              width={300}
              height={200}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white/90 text-black">
                <Palette className="h-3 w-3 mr-1" />
                {comic.style}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{comic.title || "Untitled Comic"}</h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{getStoryPreview(comic.story)}</p>

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(comic.createdAt)}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Link href="/process" className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => onView(comic)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // In a real app, this would trigger the download
              console.log("Download comic:", comic.id)
            }}
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(comic.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
