"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DownloadIcon, FolderOpenIcon, Loader2Icon, StarIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { GET_MY_PUBLISHED_COURSE_CONTENTS, GET_PUBLISHED_COURSE_CONTENTS, RATE_COURSE_CONTENT } from "@/lib/graphql"
import { cn } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"

type ContentItem = {
  id: string
  courseId: string
  title: string
  description: string | null
  attachments: Array<{ url: string; filename: string; contentType: string }>
  createdAt: string
  course?: { id: string; title: string; slug: string } | null
  myFeedback?: { rating: number; comment: string; updatedAt: string } | null
}

const RATING_WORDS = ["", "Confusing", "Hard to follow", "OK", "Good", "Very clear"]

/** One to five stars and an optional comment. Instructors see the totals and comments without names. */
function ModuleRating({ item, saved }: { item: ContentItem; saved: ContentItem["myFeedback"] }) {
  const [rating, setRating] = useState(saved?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(saved?.comment ?? "")
  const [open, setOpen] = useState(false)
  const [rate, { loading }] = useMutation(RATE_COURSE_CONTENT, {
    refetchQueries: [GET_MY_PUBLISHED_COURSE_CONTENTS],
    onCompleted: () => {
      toast.success("Thanks for the feedback")
      setOpen(false)
    },
    onError: (e) => toast.error(e.message),
  })
  const shown = hover || rating
  const send = (r: number, c: string) => rate({ variables: { contentId: item.id, rating: r, comment: c.trim() || null } })

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{saved ? "Your rating" : "How clear was this module?"}</span>
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? "" : "s"}: ${RATING_WORDS[n]}`}
              disabled={loading}
              onMouseEnter={() => setHover(n)}
              onClick={() => {
                setRating(n)
                if (n <= 3) setOpen(true)
                else send(n, comment)
              }}
              className="p-0.5"
            >
              <StarIcon className={cn("size-5", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
        {shown > 0 && <span className="text-muted-foreground text-sm">{RATING_WORDS[shown]}</span>}
        {!open && rating > 0 && (
          <button type="button" className="text-sm text-(--brand-secondary) hover:underline" onClick={() => setOpen(true)}>
            {saved?.comment ? "Edit comment" : "Add a comment"}
          </button>
        )}
      </div>
      {open && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (rating) send(rating, comment)
          }}
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder={rating <= 3 ? "What was hard to follow? Your instructor sees this without your name." : "Anything to add? Shared without your name."}
            className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
            aria-label="Comment"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !rating}
              className="inline-flex items-center gap-1 rounded-md bg-(--brand-secondary) px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2Icon className="size-4 animate-spin" />} Send
            </button>
            <button type="button" className="text-muted-foreground px-2 text-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export const StudentCourseContentScreen = () => {
  const { userProfileInfo, enrolledCoursesFromApi } = useUser()
  const [courseFilter, setCourseFilter] = useState<string>("all")

  const { data: allData, loading: loadingAll } = useQuery<{ getMyPublishedCourseContents: ContentItem[] }>(
    GET_MY_PUBLISHED_COURSE_CONTENTS,
    { skip: !userProfileInfo?.id, fetchPolicy: "network-only" }
  )

  const { data: filteredData, loading: loadingFiltered } = useQuery<{
    getPublishedCourseContents: ContentItem[]
  }>(GET_PUBLISHED_COURSE_CONTENTS, {
    variables: { courseId: courseFilter },
    skip: !userProfileInfo?.id || courseFilter === "all",
    fetchPolicy: "network-only",
  })

  const items = useMemo(
    () =>
      courseFilter === "all"
        ? allData?.getMyPublishedCourseContents ?? []
        : filteredData?.getPublishedCourseContents ?? [],
    [courseFilter, allData, filteredData]
  )
  const loading = courseFilter === "all" ? loadingAll : loadingFiltered
  // The per-course query doesn't carry the student's rating; take it from the all-courses list.
  const myFeedback = useMemo(
    () => new Map((allData?.getMyPublishedCourseContents ?? []).map((c) => [c.id, c.myFeedback ?? null])),
    [allData]
  )

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Course content</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Slides and materials shared by your instructors for your enrolled courses.
        </p>
      </div>

      <div className="mb-6">
        <label className="text-muted-foreground mb-2 block text-sm font-medium">Course</label>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border-input bg-background rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-secondary)"
        >
          <option value="all">All enrolled courses</option>
          {enrolledCoursesFromApi.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-20">
          <Loader2Icon className="size-6 animate-spin" />
          Loading materials…
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-16 text-center">
            <FolderOpenIcon className="size-12 opacity-40" />
            <p>No published course materials yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="rounded-3xl">
              <CardHeader>
                <CardDescription>{item.course?.title ?? "Course"}</CardDescription>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                {item.description ? <p className="text-muted-foreground text-sm">{item.description}</p> : null}
              </CardHeader>
              <CardContent>
                {item.attachments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No downloadable files attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {item.attachments.map((a) => (
                      <li key={a.url}>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-(--brand-secondary) hover:underline"
                        >
                          <DownloadIcon className="size-4" />
                          {a.filename || "Download file"}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <ModuleRating key={(myFeedback.get(item.id) ?? item.myFeedback)?.updatedAt ?? "new"} item={item} saved={myFeedback.get(item.id) ?? item.myFeedback} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
