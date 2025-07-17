"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Zap, Palette, Download, ArrowRight, BookOpen, ImageIcon, Wand2 } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Story Input",
    description: "Simply paste or write your story and let AI do the magic",
  },
  {
    icon: Palette,
    title: "Multiple Styles",
    description: "Choose from various comic styles: Manga, Watercolor, Ink, and more",
  },
  {
    icon: ImageIcon,
    title: "AI Generation",
    description: "Advanced AI creates beautiful comic panels from your story",
  },
  {
    icon: Download,
    title: "Export & Share",
    description: "Download your comic as PDF or share with friends",
  },
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AutoToon
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">AI Comic Generator</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Turn your stories into beautiful AI-generated comics. From text to visual storytelling in minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/create">
            <Button
              size="lg"
              className="text-lg px-8 py-6 comic-gradient text-white hover:opacity-90 transition-opacity"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Start Creating
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mb-16"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="text-center"
      >
        <Card className="max-w-2xl mx-auto comic-gradient text-white">
          <CardContent className="p-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Ready to Create Your Comic?</h3>
            <p className="mb-6 opacity-90">Join thousands of creators who have brought their stories to life with AI</p>
            <Link href="/create">
              <Button variant="secondary" size="lg" className="text-lg px-8">
                Get Started Now
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
