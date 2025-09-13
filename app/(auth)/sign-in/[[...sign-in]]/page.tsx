import { SignIn } from "@clerk/nextjs";
import { Navigation } from "@/components/layout/navigation";

const SignInPage = () => {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-screen">
        <SignIn />
      </main>
    </>
  );
};

export default SignInPage;
