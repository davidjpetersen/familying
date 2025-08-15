import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

async function saveProfile(formData: FormData) {
  "use server";

  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const displayName = formData.get("display_name")?.toString() || null;

  await supabase
    .from("users")
    .upsert({ id: user.id, display_name: displayName });

  revalidatePath("/settings/profile");
}

export default async function ProfileSettingsPage() {
  const user = await currentUser();
  const { data } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user?.id)
    .maybeSingle();

  const email = user?.emailAddresses[0]?.emailAddress || "";

  return (
    <form action={saveProfile} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
        <p className="text-sm text-muted-foreground">
          Email is managed by Clerk and cannot be changed here.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={data?.display_name || ""}
        />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}
