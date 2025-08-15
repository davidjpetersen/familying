import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function createFamily(formData: FormData) {
  "use server";
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const name = formData.get("name")?.toString() || "";
  await supabase.from("families").insert({ user_id: user.id, name });
  revalidatePath("/settings/family");
}

async function updateFamily(formData: FormData) {
  "use server";
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const id = formData.get("family_id")?.toString();
  const name = formData.get("name")?.toString() || "";
  await supabase.from("families").update({ name }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/settings/family");
}

async function addMember(formData: FormData) {
  "use server";
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const familyId = formData.get("family_id")?.toString();
  const displayName = formData.get("display_name")?.toString() || "";
  const role = formData.get("role")?.toString() || "adult";
  const { data: fam } = await supabase
    .from("families")
    .select("id")
    .eq("id", familyId)
    .eq("user_id", user.id)
    .single();
  if (!fam) throw new Error("Unauthorized");
  await supabase
    .from("family_members")
    .insert({ family_id: familyId, display_name: displayName, role });
  revalidatePath("/settings/family");
}

async function removeMember(formData: FormData) {
  "use server";
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const id = formData.get("id")?.toString();
  const familyId = formData.get("family_id")?.toString();
  const { data: fam } = await supabase
    .from("families")
    .select("id")
    .eq("id", familyId)
    .eq("user_id", user.id)
    .single();
  if (!fam) throw new Error("Unauthorized");
  await supabase.from("family_members").delete().eq("id", id).eq("family_id", familyId);
  revalidatePath("/settings/family");
}

export default async function FamilySettingsPage() {
  const user = await currentUser();
  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("user_id", user?.id)
    .maybeSingle();

  type Member = {
    id: string;
    display_name: string;
    role: string;
  };

  let members: Member[] = [];
  if (family) {
    const { data: ms } = await supabase
      .from("family_members")
      .select("id, display_name, role")
      .eq("family_id", family.id);
    members = ms || [];
  }

  if (!family) {
    return (
      <form action={createFamily} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="name">Family Name</Label>
          <Input id="name" name="name" />
        </div>
        <Button type="submit">Create</Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form action={updateFamily} className="space-y-2 max-w-md">
        <input type="hidden" name="family_id" value={family.id} />
        <Label htmlFor="name">Family Name</Label>
        <Input id="name" name="name" defaultValue={family.name} />
        <Button type="submit" className="mt-2">Save</Button>
      </form>

      <div className="space-y-4">
        <h2 className="font-semibold">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span>
                {m.display_name} ({m.role})
              </span>
              <form action={removeMember}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="family_id" value={family.id} />
                <Button variant="ghost" size="sm" type="submit">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addMember} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="family_id" value={family.id} />
          <div className="space-y-2">
            <Label htmlFor="display_name">Name</Label>
            <Input id="display_name" name="display_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="adult">Adult</option>
              <option value="child">Child</option>
            </select>
          </div>
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  );
}
