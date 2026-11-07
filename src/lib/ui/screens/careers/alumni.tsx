"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { GraduationCapIcon, PencilIcon, PlusIcon, UsersIcon } from "lucide-react"
import toast from "react-hot-toast"

import { CLOSE_ALUMNI_JOB, GET_JOB_APPLICATIONS, GET_MY_ALUMNI_JOBS, GET_MY_ALUMNI_STATUS, POST_ALUMNI_JOB, UPDATE_ALUMNI_JOB } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { CONFIG } from "@/utils/constants"
import { ApplicationsList } from "../jobs/applications"
import { EmptyState, JobCard, JobForm, Pill, jobFormFrom, jobInputFrom, jobPath, type Application, type Job } from "../jobs/shared"

type AlumniStatus = { isAlumni: boolean; since: string | null }

function jobState(j: Job) {
  if (j.awaitingReview) return { label: "Waiting for approval", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" }
  if (j.status === "OPEN") return { label: "Live", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" }
  return { label: "Closed", cls: "" }
}

export function AlumniScreen() {
  const { data, loading } = useQuery<{ myAlumniStatus: AlumniStatus }>(GET_MY_ALUMNI_STATUS)
  const status = data?.myAlumniStatus

  if (loading && !data) return <ContentAreaLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alumni</h1>
        <p className="text-muted-foreground text-sm">Help the students coming after you: share jobs at your workplace and see who applies.</p>
      </div>
      {!status?.isAlumni ? (
        <div className="bg-card space-y-3 rounded-xl border p-6">
          <GraduationCapIcon className="text-muted-foreground size-8" />
          <p className="font-medium">This opens up when you graduate</p>
          <p className="text-muted-foreground text-sm">
            Finish a course and get your certificate, and you join our alumni. Then you can post jobs and referrals for other students here.
            If you already graduated, ask the team to add you.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={CONFIG.ROUTES.STUDENT.CERTIFICATES}>My certificates</Link>
          </Button>
        </div>
      ) : (
        <AlumniJobs since={status.since} />
      )}
    </div>
  )
}

function AlumniJobs({ since }: { since: string | null }) {
  const { data, loading } = useQuery<{ myAlumniJobs: Job[] }>(GET_MY_ALUMNI_JOBS, { fetchPolicy: "cache-and-network" })
  const [post, { loading: posting }] = useMutation(POST_ALUMNI_JOB, { refetchQueries: ["GetMyAlumniJobs"] })
  const [update, { loading: updating }] = useMutation(UPDATE_ALUMNI_JOB, { refetchQueries: ["GetMyAlumniJobs"] })
  const [close] = useMutation(CLOSE_ALUMNI_JOB, { refetchQueries: ["GetMyAlumniJobs"] })
  const [editing, setEditing] = useState<Job | "new" | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const jobs = data?.myAlumniJobs ?? []

  if (editing) {
    const isNew = editing === "new"
    return (
      <div className="bg-card space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">{isNew ? "Post a job" : "Edit job"}</h2>
          <p className="text-muted-foreground text-sm">
            Staff check each post before it goes live{isNew ? "" : ", so editing sends it back for approval"}. If students apply here, we
            email you and you see them on this page.
          </p>
        </div>
        <JobForm
          alumni
          initial={isNew ? jobFormFrom(null) : jobFormFrom(editing)}
          saving={posting || updating}
          onCancel={() => setEditing(null)}
          onSubmit={async (v) => {
            const input = { ...jobInputFrom(v, false), companyName: v.companyName }
            try {
              if (isNew) await post({ variables: { input } })
              else await update({ variables: { id: editing.id, input } })
              toast.success("Sent. We'll let you know when it's live.")
              setEditing(null)
            } catch (e) {
              toast.error((e as Error).message || "Couldn't save the job")
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {since ? `Alumni since ${new Date(since).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}. ` : ""}
          Keep your{" "}
          <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="underline">
            portfolio
          </Link>{" "}
          up to date. Companies still find you there.
        </p>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon className="size-4" /> Post a job
        </Button>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !jobs.length ? (
        <EmptyState title="You haven't posted any jobs yet">Is your company hiring juniors or interns? Post the job and our students can apply.</EmptyState>
      ) : (
        jobs.map((j) => {
          const st = jobState(j)
          return (
            <div key={j.id} className="space-y-3">
              <JobCard
                job={j}
                href={j.status === "OPEN" ? jobPath(j.id) : undefined}
                actions={
                  <>
                    <Pill className={st.cls}>{st.label}</Pill>
                    {j.reviewNote && <span className="text-muted-foreground text-xs">Staff note: {j.reviewNote}</span>}
                    <div className="ml-auto flex flex-wrap gap-2">
                      {j.applyMode === "PORTAL" && (
                        <Button size="sm" variant="outline" onClick={() => setViewing(viewing === j.id ? null : j.id)}>
                          <UsersIcon className="size-4" /> {j.applicationsCount ?? 0} applied
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditing(j)}>
                        <PencilIcon className="size-4" /> Edit
                      </Button>
                      {(j.status === "OPEN" || j.awaitingReview) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void close({ variables: { id: j.id } })
                              .then(() => toast.success("Closed"))
                              .catch((e: Error) => toast.error(e.message))
                          }
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </>
                }
              />
              {viewing === j.id && <Applicants jobId={j.id} />}
            </div>
          )
        })
      )}
    </div>
  )
}

function Applicants({ jobId }: { jobId: string }) {
  const { data, loading } = useQuery<{ jobApplications: Application[] }>(GET_JOB_APPLICATIONS, { variables: { jobId }, fetchPolicy: "network-only" })
  if (loading && !data) return <ContentAreaLoader />
  return (
    <div className="border-l-2 pl-4">
      <ApplicationsList applications={data?.jobApplications ?? []} empty="No one has applied yet" />
    </div>
  )
}
