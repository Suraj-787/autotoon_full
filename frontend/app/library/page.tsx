"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ComicCard } from "@/components/comic-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, LibraryIcon } from "lucide-react"
import Link from "next/link"

interface SavedComic {
  id: string
  title: string
  style: string
  thumbnail: string
  createdAt: number
  story: string
}

export default function LibraryPage() {
  const [comics, setComics] = useState<SavedComic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredComics, setFilteredComics] = useState<SavedComic[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load saved comics from localStorage
    const saved = localStorage.getItem("savedComics")
    if (saved) {
      const parsedComics = JSON.parse(saved)
      setComics(parsedComics)
      setFilteredComics(parsedComics)
    }
  }, [])

  useEffect(() => {
    // Filter comics based on search term
    const filtered = comics.filter(
      (comic) =>
        comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comic.style.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredComics(filtered)
  }, [searchTerm, comics])

  const handleDelete = (id: string) => {
    const updatedComics = comics.filter((comic) => comic.id !== id)
    setComics(updatedComics)
    localStorage.setItem("savedComics", JSON.stringify(updatedComics))

    toast({
      title: "Comic Deleted",
      description: "The comic has been removed from your library.",
    })
  }

  const handleView = (comic: SavedComic) => {
    // Store the comic data for viewing
    localStorage.setItem(
      "currentGeneration",
      JSON.stringify({
        id: comic.id,
        story: comic.story,
        style: comic.style,
        timestamp: comic.createdAt,
      }),
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <LibraryIcon className="h-8 w-8" />
              Your Library
            </h1>
            <p className="text-muted-foreground">
              {comics.length} comic{comics.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link href="/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Comics Grid */}
        {filteredComics.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredComics.map((comic, index) => (
              <motion.div
                key={comic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ComicCard comic={comic} onView={handleView} onDelete={handleDelete} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <LibraryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{searchTerm ? "No comics found" : "No comics yet"}</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first AI-generated comic to get started"}
                </p>
                {!searchTerm && (
                  <Link href="/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Comic
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
