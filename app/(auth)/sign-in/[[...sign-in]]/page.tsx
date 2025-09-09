import { SignIn } from "@clerk/nextjs";
import { Navigation } from "@/app/components/marketing/layout/navigation";

const SignInPage = () => {
  return (
    <>
      <Navigation />
      <main className="flex justify-center items-center min-h-screen">
        <SignIn />
      </main>
    </>
  );
};

export default SignInPage;
