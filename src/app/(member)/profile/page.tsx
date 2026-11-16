import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { getActiveSports } from "@/lib/data/sports";
import { loadProfileFormValues } from "@/lib/data/profile";
import { signAvatarUrls } from "@/lib/storage";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function ProfilePage() {
  const viewer = await requireCommunityAccess("/profile");
  const supabase = await createClient();
  const [sports, initial, urls] = await Promise.all([
    getActiveSports(),
    loadProfileFormValues(supabase, viewer.id),
    signAvatarUrls(supabase, [viewer.profile?.photo_path]),
  ]);
  return (
    <AppMain className="max-w-5xl">
      <AppPageHeader
        eyebrow="Profile"
        title="How members see you."
        description="Your email, date of birth and exact location are never shown to other members."
        actions={viewer.profile ? <Button asChild variant="outline"><Link href={`/members/${viewer.id}`}>Preview</Link></Button> : undefined}
      />
      <ProfileForm sports={sports} initial={initial} photoUrl={viewer.profile?.photo_path ? urls.get(viewer.profile.photo_path) : null} />
    </AppMain>
  );
}
