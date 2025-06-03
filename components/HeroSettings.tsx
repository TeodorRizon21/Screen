'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from '@/hooks/use-toast'
import ImageUpload from "@/components/ImageUpload"
import { COLLECTIONS } from '@/lib/collections'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HeroSlide {
  id?: string
  imageUrl: string
  collectionLink: string
}

interface HeroSettingsProps {
  initialSlides: HeroSlide[]
  initialInterval: number
}

export default function HeroSettings({ initialSlides, initialInterval }: HeroSettingsProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [interval, setInterval] = useState(initialInterval)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null)

  const handleAddSlide = () => {
    setSlides([...slides, { imageUrl: '', collectionLink: '' }])
  }

  const handleRemoveSlide = (id: string) => {
    if (slides.length > 1) {
      setSlides(slides.filter(slide => slide.id !== id))
    }
    setSlideToDelete(null)
  }

  const handleSlideChange = (id: string, field: keyof HeroSlide, value: string) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, [field]: value } : slide
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slides, interval }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update hero settings')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Hero settings updated successfully",
      })
    } catch (error) {
      console.error('Error updating hero settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hero settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="interval">Auto-change Interval (seconds)</Label>
        <Input
          id="interval"
          type="number"
          value={interval / 1000}
          onChange={(e) => setInterval(Number(e.target.value) * 1000)}
          min={0.5}
          step={0.5}
          required
        />
      </div>

      {slides.map((slide, index) => (
        <div key={slide.id || index} className="border p-4 rounded-md space-y-4">
          <h3 className="font-semibold">Slide {index + 1}</h3>
          <ImageUpload
            value={slide.imageUrl ? [slide.imageUrl] : []}
            onChange={(urls) => {
              handleSlideChange(slide.id || index.toString(), 'imageUrl', urls[0] || '')
              setUploadFeedback(urls[0] ? 'Image uploaded successfully' : 'Failed to upload image')
              setTimeout(() => setUploadFeedback(null), 3000)
            }}
            maxFiles={1}
          />
          {uploadFeedback && (
            <p className={`text-sm ${uploadFeedback.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {uploadFeedback}
            </p>
          )}
          <Select
            value={slide.collectionLink}
            onValueChange={(value) => handleSlideChange(slide.id || index.toString(), 'collectionLink', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COLLECTIONS).map(([key, value]) => (
                <SelectItem key={key} value={`/collection/${encodeURIComponent(value)}`}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={() => setSlideToDelete(slide.id || index.toString())}
            disabled={slides.length === 1}
          >
            Remove Slide
          </Button>
        </div>
      ))}

      <Button type="button" onClick={handleAddSlide}>
        Add Slide
      </Button>

      <Button type="submit" disabled={isLoading || slides.length === 0}>
        {isLoading ? 'Updating...' : 'Update Hero Settings'}
      </Button>

      <AlertDialog open={!!slideToDelete} onOpenChange={() => setSlideToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the slide from the hero carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => slideToDelete && handleRemoveSlide(slideToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

