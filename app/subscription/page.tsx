import { PricingTable } from "@clerk/nextjs";
import { Navigation } from "@/components/layout/navigation";

const SubscriptionPage = () => {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PricingTable />
      </main>
    </>
  );
};

export default SubscriptionPage;
