"use client";

export const dynamic = "force-dynamic";

import { ProfileView } from "@/components/ProfileView";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";

export default function ProfilePage() {
  return (
    <PrivateRouteGate>
      <ProfileView />
    </PrivateRouteGate>
  );
}
