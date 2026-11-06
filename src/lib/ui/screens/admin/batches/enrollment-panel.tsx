"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import { BellIcon, Loader2Icon, Trash2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import { GET_WAITLIST, NOTIFY_WAITLIST_ENTRY, REMOVE_WAITLIST_ENTRY, UPDATE_BATCH } from "@/lib/graphql"
import { formatDate } from "@/lib/helpers"

export type EnrollmentBatch = {
  id: string
  name: string
  startDate: string | null
  seats: number | null
  seatsLeft: number | null
  isOpenForEnrollment: boolean
  waitlistCount: number
}

type WaitlistEntry = { id: string; name: string; email: string; phone: string; status: string; notifiedAt: string | null; createdAt: string }

/** One line under a batch: start date, seats and whether applicants can pick it. */
export function batchEnrollmentSummary(b: EnrollmentBatch) {
  const parts: string[] = []
  if (b.isOpenForEnrollment) parts.push("open for enrollment")
  if (b.startDate) parts.push(`starts ${formatDate(b.startDate)}`)
  if (b.seats != null) parts.push(`${b.seatsLeft ?? 0}/${b.seats} seats left`)
  if (b.waitlistCount > 0) parts.push(`${b.waitlistCount} waiting`)
  return parts.join(" · ")
}

/** Start date, seats, "open for enrollment" and the waiting list of one batch. */
export function BatchEnrollmentPanel({ batch, onSaved }: { batch: EnrollmentBatch; onSaved: () => void }) {
  const [startDate, setStartDate] = useState(batch.startDate ?? "")
  const [seats, setSeats] = useState(batch.seats == null ? "" : String(batch.seats))
  const [open, setOpen] = useState(batch.isOpenForEnrollment)
  const [updateBatch, { loading: saving }] = useMutation(UPDATE_BATCH)
  const waitlist = useQuery<{ getWaitlist: WaitlistEntry[] }>(GET_WAITLIST, { variables: { batchId: batch.id }, fetchPolicy: "network-only" })
  const [notify, { loading: notifying }] = useMutation(NOTIFY_WAITLIST_ENTRY)
  const [remove] = useMutation(REMOVE_WAITLIST_ENTRY)
  const entries = waitlist.data?.getWaitlist ?? []

  const save = async () => {
    try {
      await updateBatch({
        variables: {
          id: batch.id,
          isOpenForEnrollment: open,
          ...(startDate ? { startDate } : { clearStartDate: true }),
          ...(seats.trim() ? { seats: Number(seats) } : { clearSeats: true }),
        },
      })
      toast.success("Batch saved")
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save")
    }
  }

  return (
    <div className="bg-muted/30 space-y-3 px-3 py-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">Start date</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8" />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">Seats (empty = no limit)</span>
          <Input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} className="h-8" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
        Open for enrollment (shown on the website and the enrollment form)
      </label>
      <div className="flex justify-end">
        <Button size="sm" variant="brand-secondary" disabled={saving} onClick={() => void save()}>
          {saving && <Loader2Icon className="size-4 animate-spin" />} Save
        </Button>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold">Waiting list ({entries.length})</div>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nobody is waiting. When the batch is full, applicants can join the list.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-background">
            {entries.map((w) => (
              <li key={w.id} className="flex items-center gap-2 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{w.name}</div>
                  <div className="text-muted-foreground truncate text-[11px]">
                    {w.email}
                    {w.phone ? ` · ${w.phone}` : ""}
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Joined {formatDate(w.createdAt)}
                    {w.notifiedAt ? ` · told ${formatDate(w.notifiedAt)}` : ""}
                  </div>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Email: a seat opened"
                  disabled={notifying}
                  onClick={() =>
                    notify({ variables: { id: w.id } })
                      .then(() => {
                        toast.success(`Emailed ${w.name}`)
                        void waitlist.refetch()
                      })
                      .catch((e) => toast.error(e.message))
                  }
                >
                  <BellIcon className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Remove from the list"
                  className="text-destructive"
                  onClick={() =>
                    remove({ variables: { id: w.id } })
                      .then(() => {
                        void waitlist.refetch()
                        onSaved()
                      })
                      .catch((e) => toast.error(e.message))
                  }
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
