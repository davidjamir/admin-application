import { getRolesByMode } from "@/lib/facebook-permissions"

export const facebookAssignmentService = {
  async getAssignedPageIdsInBusinessBatch(
    token: string,
    businessId: string,
    userId: string,
    pageIds: string[]
  ): Promise<string[]> {
    if (pageIds.length === 0) return []

    const batch = pageIds.map((pageId) => ({
      method: "GET",
      relative_url: `v25.0/${encodeURIComponent(businessId)}/assigned_users?user=${encodeURIComponent(
        userId
      )}&asset=${encodeURIComponent(pageId)}&fields=id`,
    }))

    const body = new URLSearchParams()
    body.set("access_token", token)
    body.set("batch", JSON.stringify(batch))

    const res = await fetch("https://graph.facebook.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!res.ok) return []

    const data = (await res.json()) as Array<{ code?: number; body?: string }>
    const assigned: string[] = []

    for (let i = 0; i < pageIds.length; i += 1) {
      const pageId = pageIds[i]
      const item = data?.[i]
      if (!item || (item.code ?? 500) >= 400) continue

      try {
        const parsed = item.body
          ? (JSON.parse(item.body) as { data?: Array<{ id?: string }> })
          : undefined
        const hasInBusiness = (parsed?.data ?? []).some((entry) => entry.id === userId)
        if (hasInBusiness) assigned.push(pageId)
      } catch {
        // Ignore invalid response item.
      }
    }

    return assigned
  },

  async removeSystemUserFromPagesBatch(
    pageIds: string[],
    businessId: string,
    userId: string,
    token: string
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const batch = pageIds.map((pageId) => ({
      method: "DELETE",
      relative_url: `v25.0/${businessId}/assigned_users?user=${encodeURIComponent(
        userId
      )}&asset=${encodeURIComponent(pageId)}`,
    }))

    const body = new URLSearchParams()
    body.set("access_token", token)
    body.set("batch", JSON.stringify(batch))

    const res = await fetch("https://graph.facebook.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    if (!res.ok) throw new Error("Failed to remove user permissions by batch request")

    const data = (await res.json()) as Array<{
      code?: number
      body?: string
    }>
    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    for (let i = 0; i < pageIds.length; i += 1) {
      const pageId = pageIds[i]
      const item = data?.[i]
      const code = item?.code ?? 500
      if (code >= 400) {
        let message = "Failed to remove permission"
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

  async removeSystemUserFromPagesByPageAssignedUsersBatch(
    pageIds: string[],
    userId: string,
    token: string
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const batch = pageIds.map((pageId) => ({
      method: "DELETE",
      relative_url: `v25.0/${encodeURIComponent(pageId)}/assigned_users?user=${encodeURIComponent(
        userId
      )}`,
    }))

    const body = new URLSearchParams()
    body.set("access_token", token)
    body.set("batch", JSON.stringify(batch))

    const res = await fetch("https://graph.facebook.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    if (!res.ok) throw new Error("Failed to remove user permissions by batch request")

    const data = (await res.json()) as Array<{
      code?: number
      body?: string
    }>
    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    for (let i = 0; i < pageIds.length; i += 1) {
      const pageId = pageIds[i]
      const item = data?.[i]
      const code = item?.code ?? 500
      if (code >= 400) {
        let message = "Failed to remove permission"
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

  async assignUserToPagesByBusinessAssignedUsersBatch(
    pageIds: string[],
    businessId: string,
    userId: string,
    token: string,
    taskMode: "basic" | "full" = "basic"
  ): Promise<{ successPageIds: string[]; failed: Array<{ pageId: string; message: string }> }> {
    if (pageIds.length === 0) return { successPageIds: [], failed: [] }

    const tasks = getRolesByMode(taskMode)
    const failed: Array<{ pageId: string; message: string }> = []
    const successPageIds: string[] = []

    await Promise.all(
      pageIds.map(async (pageId) => {
        try {
          const url = new URL(
            `https://graph.facebook.com/v25.0/${encodeURIComponent(pageId)}/assigned_users`
          )
          url.searchParams.set("access_token", token)
          const body = new FormData()
          body.append("user", userId)
          body.append("tasks", JSON.stringify(tasks))
          body.append("business", businessId)

          const res = await fetch(url.toString(), {
            method: "POST",
            body,
          })

          const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
          if (!res.ok || data.error?.message) {
            failed.push({ pageId, message: data.error?.message || "Failed to assign permission" })
            return
          }

          successPageIds.push(pageId)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to assign permission"
          failed.push({ pageId, message })
        }
      })
    )

    return { successPageIds, failed }
  },
}
