import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-start md:items-center py-4 md:py-8">
      <SignIn />
    </div>
  );
}
