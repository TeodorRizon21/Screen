"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show the back button on the home page or admin pages
  if (pathname === "/" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="container mx-auto px-6">
      <Button
        variant="ghost"
        className="mt-12 md:mt-10 mb-4 hover:bg-transparent"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Go Back
      </Button>
    </div>
  );
}
