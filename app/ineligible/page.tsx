import { redirect } from "next/navigation";

export default function IneligiblePage() {
  redirect("/#access");
}
