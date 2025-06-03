"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function NewsletterManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch("/api/admin/newsletter-subscribers");
      if (!response.ok) throw new Error("Failed to fetch subscribers");
      const data = await response.json();
      setSubscribers(data);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch newsletter subscribers",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(subscribers.map((s) => s.id));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSelectSubscriber = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers([...selectedSubscribers, id]);
    } else {
      setSelectedSubscribers(
        selectedSubscribers.filter((subId) => subId !== id)
      );
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) {
      toast({
        title: "Error",
        description: "Please fill in both subject and content",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubscribers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subscriber",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const selectedEmails = subscribers
        .filter((s) => selectedSubscribers.includes(s.id))
        .map((s) => s.email);

      // Adăugăm link-ul de dezabonare în conținutul emailului
      const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`;
      const emailContentWithUnsubscribe = `
        ${emailContent}
        <br><br>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Pentru a te dezabona de la acest newsletter, 
          <a href="${unsubscribeLink}?email={email}" style="color: #0066cc;">click aici</a>.
        </p>
      `;

      // Trimitem emailurile individual pentru fiecare abonat
      const results = await Promise.allSettled(
        selectedEmails.map(async (email) => {
          const personalizedContent = emailContentWithUnsubscribe.replace(
            "{email}",
            encodeURIComponent(email)
          );

          const response = await fetch("/api/admin/send-newsletter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emails: [email],
              subject: emailSubject,
              content: personalizedContent,
            }),
          });

          if (!response.ok) throw new Error("Failed to send newsletter");
          return response.json();
        })
      );

      const allSuccessful = results.every(
        (result) => result.status === "fulfilled"
      );

      if (!allSuccessful) {
        throw new Error("Some emails failed to send");
      }

      toast({
        title: "Success",
        description: "Newsletter sent successfully",
      });

      // Resetăm formularul
      setEmailSubject("");
      setEmailContent("");
      setSelectedSubscribers([]);
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Newsletter Subscribers</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedSubscribers.length === subscribers.length}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All
            </label>
          </div>
          {subscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={subscriber.id}
                  checked={selectedSubscribers.includes(subscriber.id)}
                  onCheckedChange={(checked) =>
                    handleSelectSubscriber(subscriber.id, checked as boolean)
                  }
                />
                <div>
                  <span className="text-gray-900">{subscriber.email}</span>
                  <p className="text-sm text-gray-500">
                    Joined:{" "}
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  subscriber.isActive
                    ? "bg-green-500/20 text-green-600"
                    : "bg-red-500/20 text-red-600"
                }`}
              >
                {subscriber.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-300 pt-8">
        <h3 className="text-xl font-bold mb-4">Send Newsletter</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Subject
            </label>
            <Input
              id="subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject"
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Content
            </label>
            <Textarea
              id="content"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Enter email content (HTML supported)"
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 min-h-[200px]"
            />
          </div>
          <Button
            onClick={handleSendEmail}
            disabled={isSending || selectedSubscribers.length === 0}
            className="bg-blue-500 hover:bg-blue-600 px-6"
          >
            {isSending ? "Sending..." : "Send Newsletter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
