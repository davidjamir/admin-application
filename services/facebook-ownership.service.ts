import { getRolesByMode } from "@/lib/facebook-permissions"
import { facebookPageService } from "./facebook-page.service"

export const facebookOwnershipService = {
  async addPagesToBusinessOwnedPagesBatch(
    pageIds: string[],
    businessId: string,
    token: string
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const batch = pageIds.map((pageId) => ({
      method: "POST",
      relative_url: `v25.0/${encodeURIComponent(businessId)}/owned_pages`,
      body: `page_id=${encodeURIComponent(pageId)}`,
    }))

    const body = new URLSearchParams()
    body.set("access_token", token)
    body.set("batch", JSON.stringify(batch))

    const res = await fetch("https://graph.facebook.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    if (!res.ok) throw new Error("Failed to add pages to business by batch request")

    const data = (await res.json()) as Array<{ code?: number; body?: string }>
    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    for (let i = 0; i < pageIds.length; i += 1) {
      const pageId = pageIds[i]
      const item = data?.[i]
      const code = item?.code ?? 500
      if (code >= 400) {
        let message = "Failed to add page into business"
        try {
          const parsed = item?.body
            ? (JSON.parse(item.body) as { error?: { message?: string } })
            : undefined
          message = parsed?.error?.message || message
        } catch {
          // Keep fallback message when body is not valid JSON.
        }
        failed.push({ pageId, message })
      } else {
        successPageIds.push(pageId)
      }
    }

    return { successPageIds, failed }
  },

  async removePagesFromBusinessBatch(
    pageIds: string[],
    businessId: string,
    token: string
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    await Promise.all(
      pageIds.map(async (pageId) => {
        try {
          const url = new URL(
            `https://graph.facebook.com/v25.0/${encodeURIComponent(businessId)}/pages`
          )
          const body = new URLSearchParams()
          body.set("page_id", pageId)
          body.set("access_token", token)

          const res = await fetch(url.toString(), {
            method: "DELETE",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          })

          const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
          if (!res.ok || data.error?.message) {
            failed.push({
              pageId,
              message: data.error?.message || "Failed to remove page from business",
            })
            return
          }

          successPageIds.push(pageId)
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to remove page from business"
          failed.push({ pageId, message })
        }
      })
    )

    return { successPageIds, failed }
  },

  async sharePagesToBusinessByAgencies(
    pageIds: string[],
    targetBusinessId: string,
    token: string,
    taskMode: "basic" | "full" = "basic"
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const permittedTasks = getRolesByMode(taskMode)

    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    await Promise.all(
      pageIds.map(async (pageId) => {
        try {
          const url = new URL(
            `https://graph.facebook.com/v25.0/${encodeURIComponent(pageId)}/agencies`
          )
          let pageAccessToken = ""
          try {
            pageAccessToken = await facebookPageService.getPageTokenFromMeAccounts(token, pageId)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Cannot resolve page access token"
            failed.push({ pageId, message })
            return
          }

          const body = new FormData()
          body.append("business", targetBusinessId)
          body.append("permitted_tasks", JSON.stringify(permittedTasks))
          body.append("access_token", pageAccessToken)

          const res = await fetch(url.toString(), {
            method: "POST",
            body,
          })

          const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
          if (!res.ok || data.error?.message) {
            failed.push({
              pageId,
              message: data.error?.message || "Failed to share page to target business",
            })
            return
          }

          successPageIds.push(pageId)
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to share page to target business"
          failed.push({ pageId, message })
        }
      })
    )

    return { successPageIds, failed }
  },
}
