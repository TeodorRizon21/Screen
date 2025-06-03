"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface CarouselImage {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
}

interface HeroCarouselEditorProps {
  initialImages: CarouselImage[];
}

export default function HeroCarouselEditor({
  initialImages,
}: HeroCarouselEditorProps) {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(
    initialImages || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    [key: string]: string;
  }>({});

  const addNewImage = () => {
    const newId = `slide-${Date.now()}`;
    setCarouselImages([
      ...carouselImages,
      { id: newId, imageUrl: "", linkUrl: "", title: "" },
    ]);
  };

  const removeImage = (id: string) => {
    setCarouselImages(carouselImages.filter((image) => image.id !== id));
  };

  const updateImage = (
    id: string,
    field: keyof CarouselImage,
    value: string
  ) => {
    setCarouselImages(
      carouselImages.map((image) =>
        image.id === id ? { ...image, [field]: value } : image
      )
    );
  };

  const handleImageUpload = (id: string, urls: string[]) => {
    if (urls.length > 0) {
      updateImage(id, "imageUrl", urls[0]);
      setUploadFeedback({
        ...uploadFeedback,
        [id]: "Imagine încărcată cu succes",
      });

      setTimeout(() => {
        setUploadFeedback((prev) => {
          const newFeedback = { ...prev };
          delete newFeedback[id];
          return newFeedback;
        });
      }, 3000);
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === carouselImages.length - 1)
    ) {
      return;
    }

    const newImages = [...carouselImages];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const [removed] = newImages.splice(index, 1);
    newImages.splice(newIndex, 0, removed);
    setCarouselImages(newImages);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newImages = [...carouselImages];
    const [removed] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, removed);
    setCarouselImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validare - verificăm că toate imaginile au o imagine încărcată
      const hasInvalidImages = carouselImages.some((image) => !image.imageUrl);

      if (hasInvalidImages) {
        toast({
          title: "Eroare",
          description: "Toate imaginile trebuie să aibă o imagine încărcată",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/admin/hero-carousel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carouselImages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update carousel settings");
      }

      toast({
        title: "Success",
        description: "Caruselul a fost actualizat cu succes",
      });
    } catch (error) {
      console.error("Error updating carousel settings:", error);
      toast({
        title: "Error",
        description: "Nu s-a putut actualiza caruselul",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Imagini Carusel</h3>
        <Button
          type="button"
          onClick={addNewImage}
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Adaugă imagine
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Adaugă imagini pentru carusel. Poți reordona imaginile prin drag and
        drop. Dimensiunea recomandată este de 1200x600 pixeli.
      </p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="carousel-images">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-6"
            >
              {carouselImages.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="border p-4 rounded-md bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Slide {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveImage(index, "up")}
                            className="h-8 w-8"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === carouselImages.length - 1}
                            onClick={() => moveImage(index, "down")}
                            className="h-8 w-8"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeImage(image.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Șterge
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`image-${image.id}`}>
                            Imagine Slide
                          </Label>
                          <ImageUpload
                            value={image.imageUrl ? [image.imageUrl] : []}
                            onChange={(urls) =>
                              handleImageUpload(image.id, urls)
                            }
                            maxFiles={1}
                          />
                          {uploadFeedback[image.id] && (
                            <p className="text-sm text-green-500 mt-1">
                              {uploadFeedback[image.id]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`title-${image.id}`}>
                            Titlu (opțional)
                          </Label>
                          <Input
                            id={`title-${image.id}`}
                            value={image.title || ""}
                            onChange={(e) =>
                              updateImage(image.id, "title", e.target.value)
                            }
                            placeholder="ex: Colecția BMW"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`link-${image.id}`}>
                            Link (opțional)
                          </Label>
                          <Input
                            id={`link-${image.id}`}
                            value={image.linkUrl || ""}
                            onChange={(e) =>
                              updateImage(image.id, "linkUrl", e.target.value)
                            }
                            placeholder="ex: /collection/BMW"
                          />
                          <p className="text-xs text-gray-500">
                            Introdu un URL unde va duce slide-ul când este
                            apăsat.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {carouselImages.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-md">
          <p className="text-gray-500">Nu există imagini în carusel.</p>
          <Button
            type="button"
            variant="outline"
            onClick={addNewImage}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-1" /> Adaugă prima imagine
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || carouselImages.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Se salvează..." : "Salvează caruselul"}
        </Button>
      </div>
    </form>
  );
}
