"use client"

import { useQuery } from "@apollo/client/react"

import { cn, formatDateLong } from "@/lib/helpers"
import { GET_NEWS_POST } from "@/lib/graphql"
import { siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { PostLayout, PostNotFound } from "@/lib/ui/useable-components/site-chrome/post-layout"
import { CONFIG } from "@/utils/constants/config"

const NEWS = CONFIG.ROUTES.PUBLIC.NEWS

export const PublicNewsDetailScreen = ({ id }: { id: string }) => {
  const { data, loading, error } = useQuery<{
    getNewsPost: { id: string; title: string; description: string; createdAt: string; updatedAt: string } | null
  }>(GET_NEWS_POST, { variables: { id } })
  const post = data?.getNewsPost

  if (loading) {
    return <div className={cn(siteContainer, "text-muted-foreground py-24 font-mono text-xs")}>loading…</div>
  }

  if (error || !post) {
    return (
      <PostNotFound
        title="Post not found"
        text="This news post may have been removed or the link is incorrect."
        backHref={NEWS}
        backLabel="Back to news"
      />
    )
  }

  return (
    <PostLayout
      backHref={NEWS}
      backLabel="all news"
      meta={["news", post.createdAt && formatDateLong(post.createdAt)].filter(Boolean).join(" · ")}
      title={post.title}
    >
      <p className="text-foreground/90 whitespace-pre-wrap text-[17px] leading-8">{post.description}</p>
    </PostLayout>
  )
}
