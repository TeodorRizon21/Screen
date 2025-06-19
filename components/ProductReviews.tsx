import { useEffect, useState } from "react";
import { Star, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
  userImage: string | null;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `/api/reviews?productId=${productId}&sortBy=${sortBy}&order=${order}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [productId, sortBy, order]);

  if (isLoading) {
    return <div className="text-center py-4">Se încarcă recenziile...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Acest produs nu are încă recenzii.
      </div>
    );
  }

  const averageRating =
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold">Recenzii ({reviews.length})</h3>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`h-5 w-5 ${
                  value <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {averageRating.toFixed(1)} din 5
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={sortBy}
            onValueChange={(value: "date" | "rating") => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortează după" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(value: "asc" | "desc") => setOrder(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descrescător</SelectItem>
              <SelectItem value="asc">Crescător</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground italic">
        ✓ Toate recenziile sunt verificate și provin exclusiv de la clienți care
        au achiziționat acest produs
      </p>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  {review.userImage ? (
                    <AvatarImage src={review.userImage} alt={review.userName} />
                  ) : (
                    <AvatarFallback>
                      {review.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{review.userName}</p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`h-4 w-4 ${
                          value <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("ro-RO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700 mt-2">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
