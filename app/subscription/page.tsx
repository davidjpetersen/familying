import { PricingTable } from "@clerk/nextjs";
import { Navigation } from "@/app/components/marketing/layout/navigation";

const SubscriptionPage = () => {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <PricingTable />
      </main>
    </>
  );
};

export default SubscriptionPage;
