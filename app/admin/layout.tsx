import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] w-full mt-[-150px] md:mt-[-140px]">
      <div className="pt-[150px] md:pt-[140px]">
        <main>{children}</main>
      </div>
    </div>
  );
}
