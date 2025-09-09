import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/app/components/marketing/layout/navigation";

const MyCookBookPage = async () => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  return (
    <>
      <Navigation />
      <main>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome to your personalized family dashboard. Your toolkit is being built based on your quiz responses.
          </p>
        </div>
      </main>
    </>
  );
};

export default MyCookBookPage;
