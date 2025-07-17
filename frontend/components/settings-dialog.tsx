"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { Settings, Monitor, Sun, Moon, Zap, Palette, ImageIcon } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AppSettings {
  highResMode: boolean
  defaultStyle: string
  concurrencyEnabled: boolean
  autoSave: boolean
}

const defaultSettings: AppSettings = {
  highResMode: false,
  defaultStyle: "2d-flat",
  concurrencyEnabled: true,
  autoSave: true,
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("appSettings")
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) })
    }
  }, [])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("appSettings", JSON.stringify(newSettings))
  }

  const comicStyles = [
    { value: "2d-flat", label: "2D Flat" },
    { value: "manga", label: "Manga" },
    { value: "watercolor", label: "Watercolor" },
    { value: "ink", label: "Ink" },
    { value: "cartoon", label: "Cartoon" },
    { value: "realistic", label: "Realistic" },
    { value: "vintage", label: "Vintage" },
    { value: "minimalist", label: "Minimalist" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-select" className="text-sm font-medium">
                  Theme
                </Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">High Resolution Mode</Label>
                  <p className="text-xs text-muted-foreground">Generate higher quality images (slower processing)</p>
                </div>
                <Switch
                  checked={settings.highResMode}
                  onCheckedChange={(checked) => updateSetting("highResMode", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Default Comic Style</Label>
                <Select value={settings.defaultStyle} onValueChange={(value) => updateSetting("defaultStyle", value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {comicStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        <div className="flex items-center gap-2">
                          <Palette className="h-3 w-3" />
                          {style.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Concurrency</Label>
                  <p className="text-xs text-muted-foreground">
                    Process multiple panels simultaneously (faster generation)
                  </p>
                </div>
                <Switch
                  checked={settings.concurrencyEnabled}
                  onCheckedChange={(checked) => updateSetting("concurrencyEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Storage & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-save Comics</Label>
                  <p className="text-xs text-muted-foreground">Automatically save generated comics to your library</p>
                </div>
                <Switch checked={settings.autoSave} onCheckedChange={(checked) => updateSetting("autoSave", checked)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
