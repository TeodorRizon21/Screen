import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  orderId: string;
  productName: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  orderId,
  productName,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Eroare",
        description: "Te rugăm să selectezi un rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Sending review data:", {
        productId,
        orderId,
        rating,
        comment,
      });

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server error response:", errorData);
        throw new Error(errorData);
      }

      const data = await response.json();
      console.log("Review submitted successfully:", data);

      toast({
        title: "Succes!",
        description: "Recenzia ta a fost adăugată cu succes.",
      });
      onClose();
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu am putut adăuga recenzia. Te rugăm să încerci din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă o recenzie pentru {productName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Textarea
              placeholder="Scrie-ți părerea despre produs..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anulează
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Se trimite..." : "Trimite recenzia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
