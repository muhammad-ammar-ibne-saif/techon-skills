import { redirect } from "next/navigation"

import { CONFIG } from "@/utils/constants"

export default function EmployerHome() {
  redirect(CONFIG.ROUTES.EMPLOYER.DASHBOARD)
}
