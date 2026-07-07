import ModernSidebar from "@/components/ui/sidebar";
import JadwalClient from "../jadwal-client";
import { getTabelJadwalByWorkshop } from "@/lib/queries/jadwal";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type JwtPayload = {
  role?: string;
};

export default async function TironPage() {
  const workshop = "Tiron";

  // Fetch rows from DB filtered by workshop
  const rows = await getTabelJadwalByWorkshop(workshop);

  // Determine whether the current user can manage schedule (same logic as schedule page)
  let canManageSchedule = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const secret = process.env.JWT_SECRET;

    if (token && secret) {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      canManageSchedule = decoded?.role === "PERENCANAAN" || decoded?.role === "ADMIN";
    }
  } catch {
    canManageSchedule = false;
  }

  return (
    <ModernSidebar>
      <JadwalClient
        initialRows={rows}
        selectedLine={workshop}
        canManageSchedule={canManageSchedule}
        disableAutoRefresh={true}
        useProcessColor={true}
        processPalette={'dark'}
      />
    </ModernSidebar>
  );
}
