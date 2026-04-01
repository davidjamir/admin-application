import { getRolesByMode } from "@/lib/facebook-permissions"

const LIMIT = 500

export const facebookAssetGroupService = {
  async getBusinessAssetGroups(
    token: string,
    businessId: string
  ): Promise<Array<{ id: string; name: string }>> {
    const fetchAll = async (edge: string) => {
      const items: Array<{ id: string; name: string }> = []
      let url: string | null = `https://graph.facebook.com/v25.0/${businessId}/${edge}?access_token=${encodeURIComponent(
        token
      )}&limit=${LIMIT}`
      while (url) {
        const res = await fetch(url)
        if (!res.ok) break
        const data = (await res.json()) as {
          data?: Array<{ id?: string; name?: string }>
          paging?: { next?: string }
          error?: { message?: string }
        }
        if (data.error?.message) break
        const list = (data.data ?? []).filter((item) => item.id)
        for (const item of list) {
          const id = item.id as string
          items.push({ id, name: (item.name as string) || id })
        }
        url = data.paging?.next ?? null
      }
      return items
    }

    const [owned, client] = await Promise.all([
      fetchAll("business_asset_groups"),
      fetchAll("client_asset_groups").catch(() => []),
    ])

    const seen = new Set<string>()
    const merged: Array<{ id: string; name: string }> = []
    for (const item of [...owned, ...client]) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
    return merged
  },

  async updateBusinessAssetGroup(token: string, assetGroupId: string, name: string): Promise<void> {
    const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}`)
    url.searchParams.set("name", name.trim())
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "POST",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async deleteBusinessAssetGroup(token: string, assetGroupId: string): Promise<void> {
    const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}`)
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "DELETE",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async getAssetGroupAssignedUsers(
    token: string,
    assetGroupId: string,
    businessId: string
  ): Promise<Array<{ id: string; name: string; page_roles?: string[] }>> {
    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/assigned_users`)
    url.searchParams.set("business", businessId)
    url.searchParams.set("fields", "id,name,page_roles")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch asset group assigned users")
    }

    const data = (await res.json()) as {
      data?: Array<{ id?: string; name?: string; page_roles?: string[] }>
      error?: { message?: string }
    }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return (data.data ?? [])
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id as string,
        name: (item.name as string) || item.id || "",
        page_roles: item.page_roles,
      }))
  },

  async assignUserToAssetGroup(
    token: string,
    assetGroupId: string,
    businessId: string,
    userId: string,
    pageRoles: string[] = getRolesByMode("basic")
  ): Promise<void> {
    const url = new URL(
      `https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/assigned_users`
    )
    url.searchParams.set("business", businessId)
    url.searchParams.set("user", userId)
    url.searchParams.set("page_roles", JSON.stringify(pageRoles))
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "POST",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async removeUserFromAssetGroup(
    token: string,
    assetGroupId: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    const url = new URL(
      `https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/assigned_users`
    )
    url.searchParams.set("business", businessId)
    url.searchParams.set("user", userId)
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "DELETE",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async getAssetGroupContainedPagesCount(token: string, assetGroupId: string): Promise<number> {
    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/contained_pages`)
    url.searchParams.set("access_token", token)
    url.searchParams.set("summary", "1")
    url.searchParams.set("limit", "0")

    const res = await fetch(url.toString())
    if (!res.ok) return 0

    const data = (await res.json()) as {
      summary?: { total_count?: number }
      error?: { message?: string }
    }
    if (data.error?.message) return 0
    return data.summary?.total_count ?? 0
  },

  async getAssetGroupContainedPages(
    token: string,
    assetGroupId: string
  ): Promise<Array<{ id: string; name?: string }>> {
    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/contained_pages`)
    url.searchParams.set("fields", "id,name")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch asset group contained pages")
    }

    const data = (await res.json()) as {
      data?: Array<{ id?: string; name?: string }>
      error?: { message?: string }
    }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return (data.data ?? [])
      .filter((item) => item.id)
      .map((item) => ({ id: item.id as string, name: item.name }))
  },

  async addPageToAssetGroup(token: string, assetGroupId: string, pageId: string): Promise<void> {
    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/contained_pages`)
    url.searchParams.set("asset_id", pageId)
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "POST",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async removePageFromAssetGroup(token: string, assetGroupId: string, pageId: string): Promise<void> {
    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/contained_pages`)
    url.searchParams.set("asset_id", pageId)
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "DELETE",
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },
}
