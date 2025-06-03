import { auth as clerkAuth, currentUser as clerkUser } from "@clerk/nextjs/server";

export async function isAdmin() {
  const authResult = await clerkAuth();
  const userId = authResult.userId;
  if (!userId) return false;
  
  const user = await clerkUser();
  return user?.publicMetadata?.isAdmin === true;
}

