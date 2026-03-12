import type { Profile } from "@/hooks/useProfile";

/**
 * Keep this intentionally simple: we only need enough to drive onboarding routing.
 * "Complete" means the user has provided a name and at least one taste signal.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.display_name && profile.display_name.trim().length > 0);
  const hasTaste =
    (profile.favorite_genres?.length || 0) > 0 ||
    (profile.favorite_artists?.length || 0) > 0 ||
    (profile.top_songs?.length || 0) > 0;

  return hasName && hasTaste;
}

