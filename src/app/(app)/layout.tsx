import { requireUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Nav user={user} />
      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
