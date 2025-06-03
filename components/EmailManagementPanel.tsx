"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface AdminEmail {
  id: string;
  email: string;
}

export default function EmailManagementPanel() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/admin/notification-emails");
      if (!response.ok) throw new Error("Failed to fetch emails");
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notification emails.",
        variant: "destructive",
      });
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/notification-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!response.ok) throw new Error("Failed to add email");
      await fetchEmails();
      setNewEmail("");
      toast({
        title: "Success",
        description: "Email added successfully.",
      });
    } catch (error) {
      console.error("Error adding email:", error);
      toast({
        title: "Error",
        description: "Failed to add email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notification-emails/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete email");
      await fetchEmails();
      toast({
        title: "Success",
        description: "Email deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting email:", error);
      toast({
        title: "Error",
        description: "Failed to delete email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Admin Notification Emails</h2>
        <form onSubmit={handleAddEmail} className="flex gap-4 mb-8">
          <div className="flex-1">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 px-6"
          >
            {isLoading ? "Adding..." : "Add Email"}
          </Button>
        </form>
        <div className="space-y-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-300"
            >
              <span className="text-gray-900">{email.email}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteEmail(email.id)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700 border border-red-500/30"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
