import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const MyCookBookPage = async () => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Cookbook</h1>
        <p className="text-lg text-gray-600">
          Your personal cookbook is ready to be built. Recipe functionality has been removed from the template.
        </p>
      </div>
    </main>
  );
};

export default MyCookBookPage;
