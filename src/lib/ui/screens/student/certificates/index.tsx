"use client"

import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { AwardIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { GET_MY_CERTIFICATES } from "@/lib/graphql"
import { CertificateShareButtons } from "@/lib/ui/useable-components/certificate-share"
import { cn } from "@/lib/helpers"
import { CONFIG } from "@/utils/constants"
import { formatDateLong } from "@/lib/helpers"

type CertRow = {
  id: string
  verificationCode: string
  courseName: string
  percentage: number
  grade: string
  status: string
  issuedAt: string | null
  createdAt: string
}

export const StudentCertificatesScreen = () => {
  const { data, loading, error } = useQuery<{ getMyCertificates: CertRow[] }>(GET_MY_CERTIFICATES, {
    fetchPolicy: "network-only",
  })
  const certificates = data?.getMyCertificates ?? []

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">My Certificates</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Course certificates</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Certificates issued for your completed courses. Pending certificates become downloadable once your admin
          publishes them.
        </p>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error.message}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          Loading certificates…
        </div>
      ) : certificates.length === 0 ? (
        <Card className="bg-background/70 rounded-3xl backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AwardIcon className="text-muted-foreground/50 size-12" />
            <p className="text-muted-foreground max-w-md">
              No certificates yet. When your instructor or admin issues one for a course you completed, it will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-background/70 overflow-hidden rounded-3xl backdrop-blur">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted-surface/40 border-b">
                  <tr>
                    <th className="p-4 font-semibold">Course</th>
                    <th className="p-4 font-semibold">Score</th>
                    <th className="p-4 font-semibold">Grade</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id} className="hover:bg-muted-surface/20 border-b transition-colors">
                      <td className="p-4 font-medium">{c.courseName}</td>
                      <td className="p-4">{c.percentage}%</td>
                      <td className="p-4">{c.grade}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-medium",
                            c.status === "live"
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {c.status === "live" ? "Live" : "Pending"}
                        </span>
                      </td>
                      <td className="text-muted-foreground p-4">
                        {formatDateLong(c.issuedAt ?? c.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild variant="brand-secondary" size="sm" shape="pill">
                            <Link href={`${CONFIG.ROUTES.STUDENT.CERTIFICATES}/${c.id}`}>View</Link>
                          </Button>
                          {c.status === "live" && <CertificateShareButtons cert={c} compact />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
