"use client"

import Link from "next/link"
import { useMutation } from "@apollo/client/react"
import { ExternalLinkIcon, FileTextIcon, MailIcon, PhoneIcon } from "lucide-react"
import toast from "react-hot-toast"

import { getImageSrc } from "@/lib/helpers/image"
import { SET_APPLICATION_STATUS } from "@/lib/graphql"
import {
  APPLICATION_STATUS_LABEL,
  EmptyState,
  StatusPill,
  portfolioPath,
  selectClass,
  timeAgo,
  type Application,
  type ApplicationStatus,
} from "./shared"

const STATUSES: ApplicationStatus[] = ["SUBMITTED", "VIEWED", "SHORTLISTED", "REJECTED", "HIRED"]

function ApplicationRow({ app, showJob }: { app: Application; showJob: boolean }) {
  const [setStatus, { loading }] = useMutation(SET_APPLICATION_STATUS)
  const s = app.student
  const avatar = getImageSrc(s?.profilePicture)
  const change = async (status: ApplicationStatus) => {
    try {
      await setStatus({ variables: { id: app.id, status } })
      toast.success(status === "SHORTLISTED" || status === "HIRED" ? "Updated. The student was emailed." : "Updated")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update")
    }
  }
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="bg-muted size-11 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{s?.fullName || "Student"}</p>
            <StatusPill status={app.status} />
          </div>
          {showJob && app.job && (
            <p className="text-muted-foreground text-sm">
              {app.job.title} · {app.job.companyName}
            </p>
          )}
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {s?.email && (
              <a href={`mailto:${s.email}`} className="hover:text-foreground inline-flex items-center gap-1">
                <MailIcon className="size-3.5" /> {s.email}
              </a>
            )}
            {s?.phoneNumber && (
              <a href={`tel:${s.phoneNumber}`} className="hover:text-foreground inline-flex items-center gap-1">
                <PhoneIcon className="size-3.5" /> {s.phoneNumber}
              </a>
            )}
            <span>Applied {timeAgo(app.createdAt)}</span>
          </div>
        </div>
        <select
          aria-label="Application status"
          className={`${selectClass} w-40`}
          value={app.status}
          disabled={loading}
          onChange={(e) => void change(e.target.value as ApplicationStatus)}
        >
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {APPLICATION_STATUS_LABEL[st]}
            </option>
          ))}
        </select>
      </div>
      {app.coverNote && <p className="bg-muted/50 mt-3 whitespace-pre-line rounded-lg p-3 text-sm">{app.coverNote}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {s?.portfolioSlug ? (
          <Link href={portfolioPath(s.portfolioSlug)} target="_blank" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
            <ExternalLinkIcon className="size-4" /> Portfolio
          </Link>
        ) : (
          app.portfolioUrl && (
            <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
              <ExternalLinkIcon className="size-4" /> Portfolio
            </a>
          )
        )}
        {app.cvUrl && (
          <a href={app.cvUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium">
            <FileTextIcon className="size-4" /> CV
          </a>
        )}
      </div>
    </div>
  )
}

export function ApplicationsList({ applications, showJob = false, empty }: { applications: Application[]; showJob?: boolean; empty: string }) {
  if (!applications.length) return <EmptyState title={empty} />
  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <ApplicationRow key={a.id} app={a} showJob={showJob} />
      ))}
    </div>
  )
}
