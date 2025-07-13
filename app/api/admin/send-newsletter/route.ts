import { NextResponse } from "next/server";
import { sendNewsletterEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { emails, subject, content } = await request.json();

    if (!emails || !subject || !content) {
      return NextResponse.json(
        { error: "Emails, subject and content are required" },
        { status: 400 }
      );
    }

    // Send to each email
    const results = await Promise.allSettled(
      emails.map((email: string) => sendNewsletterEmail(email, subject, content))
    );

    // Check if all emails were sent successfully
    const allSuccessful = results.every(
      (result) => result.status === "fulfilled" && !("error" in (result.value || {}))
    );

    if (!allSuccessful) {
      // Log failed emails for debugging
      results.forEach((result, index) => {
        if (result.status === "rejected" || ("value" in result && "error" in (result.value || {}))) {
          console.error(`Failed to send to email ${emails[index]}:`, 
            result.status === "rejected" ? result.reason : result.value
          );
        }
      });

      return NextResponse.json(
        { error: "Some emails failed to send" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
} 