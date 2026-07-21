import { AdminView } from "../../components/scout/views";

export const metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminView />;
}
