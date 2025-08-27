import { UserProfile } from "@clerk/nextjs"
import { Palette } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function UserProfilePage() {
  return (
    <UserProfile>
      <UserProfile.Page
        label="Appearance"
        labelIcon={<Palette className="h-4 w-4" />}
        url="appearance"
      >
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-medium">Theme</h2>
          <ThemeSwitcher />
        </div>
      </UserProfile.Page>
    </UserProfile>
  )
}
