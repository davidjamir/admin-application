import { FacebookBusiness, FacebookPage } from "@/types/facebook"

const LIMIT = 200

export const facebookBusinessService = {
  async getBusinesses(token: string): Promise<FacebookBusiness[]> {
    const url = new URL("https://graph.facebook.com/me/businesses")
    url.searchParams.set("fields", "id,name,permitted_roles")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch businesses")
    }

    const data = (await res.json()) as { data?: FacebookBusiness[]; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return data.data ?? []
  },

  async getBusinessCounts(
    token: string,
    businessId: string,
    force = false
  ): Promise<{ pages: number; apps: number }> {
    const url = new URL(`/api/facebook/business/${businessId}/counts`, window.location.origin)
    url.searchParams.set("token", token)
    if (force) url.searchParams.set("force", "true")

    const res = await fetch(url.toString())
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to fetch counts" }))
      throw new Error(errorData.error || "Failed to fetch business counts")
    }

    return (await res.json()) as { pages: number; apps: number }
  },

  async getBusinessDetails(token: string, businessId: string): Promise<Partial<FacebookBusiness>> {
    const url = new URL(`https://graph.facebook.com/${businessId}`)
    url.searchParams.set("fields", "id,name,verification_status,is_promotable,sharing_eligibility_status,can_create_ad_accounts")
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString())
    if (!res.ok) {
      // Fallback to minimal fields if detailed fields fail
      const fallbackUrl = new URL(`https://graph.facebook.com/${businessId}`)
      fallbackUrl.searchParams.set("fields", "id,name")
      fallbackUrl.searchParams.set("access_token", token)
      const fallbackRes = await fetch(fallbackUrl.toString())
      if (!fallbackRes.ok) return {}
      return (await fallbackRes.json()) as Partial<FacebookBusiness>
    }

    return (await res.json()) as Partial<FacebookBusiness>
  },

  async getBusinessPages(token: string, businessId: string): Promise<FacebookPage[]> {
    const url = new URL(`https://graph.facebook.com/${businessId}/owned_pages`)
    url.searchParams.set("fields", "id,name,category,access_token")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch business pages")
    }

    const data = (await res.json()) as { data?: FacebookPage[]; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return data.data ?? []
  },

  async getBusinessClientPages(token: string, businessId: string): Promise<FacebookPage[]> {
    const url = new URL(`https://graph.facebook.com/${businessId}/client_pages`)
    url.searchParams.set("fields", "id,name,category,access_token")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch business client pages")
    }

    const data = (await res.json()) as { data?: FacebookPage[]; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return data.data ?? []
  },

  async getBusinessSystemUsers(
    token: string,
    businessId: string
  ): Promise<Array<{ id: string; name: string; role?: string }>> {
    const url = new URL(`https://graph.facebook.com/v25.0/${businessId}/system_users`)
    url.searchParams.set("fields", "id,name,role")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch business system users")
    }

    const data = (await res.json()) as {
      data?: Array<{ id?: string; name?: string; role?: string }>
      error?: { message?: string }
    }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return (data.data ?? [])
      .filter((item) => item.id && item.name)
      .map((item) => ({
        id: item.id as string,
        name: item.name as string,
        role: item.role,
      }))
  },

  async createBusinessSystemUser(
    token: string,
    businessId: string,
    name: string,
    role: "ADMIN" | "EMPLOYEE"
  ): Promise<{ id: string }> {
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(businessId)}/system_users`
    const body = new FormData()
    body.append("name", name.trim())
    body.append("role", role)
    body.append("access_token", token)

    const res = await fetch(url, {
      method: "POST",
      body,
    })

    const data = (await res.json()) as { id?: string; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
    if (!data.id) {
      throw new Error("Failed to create system user: no id returned")
    }

    return { id: data.id }
  },

  async updateBusinessSystemUser(
    token: string,
    businessId: string,
    systemUserId: string,
    name: string
  ): Promise<void> {
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(businessId)}/system_users`
    const body = new FormData()
    body.append("system_user_id", systemUserId.trim())
    body.append("name", name.trim())
    body.append("access_token", token)

    const res = await fetch(url, {
      method: "POST",
      body,
    })

    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }
  },

  async getBusinessRolesForUser(
    token: string,
    businessId: string,
    userId: string
  ): Promise<string[]> {
    const url = new URL(`https://graph.facebook.com/${businessId}/assigned_users`)
    url.searchParams.set("fields", "id,role,tasks")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      return []
    }

    const data = (await res.json()) as {
      data?: Array<{ id?: string; role?: string; tasks?: string[] }>
      error?: { message?: string }
    }
    if (data.error?.message) {
      return []
    }

    const matched = (data.data ?? []).find((item) => item.id === userId)
    if (!matched) return []

    const roles = new Set<string>()
    if (matched.role) roles.add(matched.role)
    for (const task of matched.tasks ?? []) {
      if (task) roles.add(task)
    }

    return Array.from(roles)
  },
}
