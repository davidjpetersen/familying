import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/app/components/marketing/layout/navigation";
import { DashboardContent } from "@/app/components/dashboard/DashboardContent";
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
