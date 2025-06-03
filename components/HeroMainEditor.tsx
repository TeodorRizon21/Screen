"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { Checkbox } from "@/components/ui/checkbox";

interface HeroImage {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

interface HeroMainEditorProps {
  initialImage: HeroImage;
}

export default function HeroMainEditor({ initialImage }: HeroMainEditorProps) {
  const [heroData, setHeroData] = useState<HeroImage>(
    initialImage || {
      imageUrl: "/x6.webp",
      title: "BMW X6 2022",
      subtitle: "X6 Display",
      linkUrl: "",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [hasLink, setHasLink] = useState(!!heroData.linkUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Salvare imagine principală
      const response = await fetch("/api/admin/hero-main", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heroData: {
            ...heroData,
            linkUrl: hasLink ? heroData.linkUrl : "",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hero main image");
      }

      toast({
        title: "Success",
        description: "Hero banner actualizat cu succes",
      });
    } catch (error) {
      console.error("Error updating hero settings:", error);
      toast({
        title: "Error",
        description: "Nu s-a putut actualiza hero banner-ul",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Imagine Hero Principal</h3>
          <p className="text-sm text-gray-500">
            Aceasta este imaginea principală afișată în hero section-ul paginii
            principale.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="heroImage">Imagine Hero</Label>
          <ImageUpload
            value={heroData.imageUrl ? [heroData.imageUrl] : []}
            onChange={(urls) => {
              setHeroData({ ...heroData, imageUrl: urls[0] || "" });
              setUploadFeedback(
                urls[0]
                  ? "Imagine încărcată cu succes"
                  : "Încărcarea imaginii a eșuat"
              );
              setTimeout(() => setUploadFeedback(null), 3000);
            }}
            maxFiles={1}
          />
          {uploadFeedback && (
            <p
              className={`text-sm ${
                uploadFeedback.includes("succes")
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {uploadFeedback}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu (Linia 1)</Label>
            <Input
              id="title"
              value={heroData.title || ""}
              onChange={(e) =>
                setHeroData({ ...heroData, title: e.target.value })
              }
              placeholder="ex: BMW X6 2022"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitlu (Linia 2)</Label>
            <Input
              id="subtitle"
              value={heroData.subtitle || ""}
              onChange={(e) =>
                setHeroData({ ...heroData, subtitle: e.target.value })
              }
              placeholder="ex: X6 Display"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLink"
              checked={hasLink}
              onCheckedChange={(checked) => setHasLink(checked as boolean)}
            />
            <Label htmlFor="hasLink" className="cursor-pointer">
              Adaugă link la imagine
            </Label>
          </div>

          {hasLink && (
            <div className="pt-2">
              <Label htmlFor="linkUrl">URL Link</Label>
              <Input
                id="linkUrl"
                value={heroData.linkUrl || ""}
                onChange={(e) =>
                  setHeroData({ ...heroData, linkUrl: e.target.value })
                }
                placeholder="ex: /collection/BMW"
              />
              <p className="text-xs text-gray-500 mt-1">
                Introdu un URL relativ (ex: /collection/BMW) sau unul absolut
                (ex: https://example.com)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Se salvează..." : "Salvează modificările"}
        </Button>
      </div>
    </form>
  );
}
