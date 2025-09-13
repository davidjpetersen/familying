import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { FAMILY_ROUTES } from "../lib/config/family-organization";

const DashboardPage = async () => {
  const { userId } = await auth();

  if (!userId) redirect(FAMILY_ROUTES.signIn);

  return (
    <>
      <Navigation />
      <main>
        <DashboardContent />
      </main>
    </>
  );
};

export default DashboardPage;
