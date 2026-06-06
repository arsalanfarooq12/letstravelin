"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Profile } from "@/lib/session";

export default function Providers({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile | null;
}) {
  const setProfile = useStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  return <>{children}</>;
}
