'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segment = pathname.split("/")[2] || "profile";

  return (
    <div>
      <Tabs value={segment} className="w-full">
        <TabsList>
          <TabsTrigger value="profile" asChild>
            <Link href="/settings/profile">Profile</Link>
          </TabsTrigger>
          <TabsTrigger value="family" asChild>
            <Link href="/settings/family">Family</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href="/settings/billing">Billing</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-6">{children}</div>
    </div>
  );
}
