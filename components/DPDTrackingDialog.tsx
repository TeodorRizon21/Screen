import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DPDOperation {
  date: string;
  status: string;
  description: string;
  terminal: string;
  terminalId: number;
}

interface DPDTrackingDialogProps {
  awb: string;
}

export default function DPDTrackingDialog({ awb }: DPDTrackingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [operations, setOperations] = useState<DPDOperation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchTrackingInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/dpd/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parcelIds: [awb],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tracking info");
      }

      const data = await response.json();
      if (data.parcels?.[0]?.operations) {
        setOperations(data.parcels[0].operations);
      } else {
        toast({
          title: "Eroare",
          description:
            "Nu am putut găsi informații de tracking pentru acest AWB",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la obținerea informațiilor de tracking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ro-RO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          fetchTrackingInfo();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Urmărește AWB
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tracking AWB: {awb}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : operations.length > 0 ? (
            <div className="space-y-4">
              {operations.map((op, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{op.status}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(op.date)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {op.description}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Terminal: {op.terminal}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nu există informații de tracking disponibile
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
