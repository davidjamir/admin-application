import { FacebookBusiness, FacebookPage, FacebookUser } from "@/types/facebook"

export const facebookCoreService = {
  async getMe(token: string): Promise<FacebookUser> {
    const url = new URL("https://graph.facebook.com/me")
    url.searchParams.set("fields", "id,name")
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch Facebook user")
    }

    const data = (await res.json()) as FacebookUser & { error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return { id: data.id, name: data.name }
  },

  async getAssetsWithCache(token: string, force: boolean = false): Promise<{ businesses: FacebookBusiness[], allPages: FacebookPage[] }> {
    const url = new URL("/api/facebook/assets", window.location.origin)
    url.searchParams.set("token", token)
    if (force) url.searchParams.set("force", "true")

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch assets via cache")
    return await res.json()
  },

  async getBusinessWithCache(token: string, businessId: string, force: boolean = false): Promise<FacebookBusiness & { pages: FacebookPage[] }> {
    const url = new URL(`/api/facebook/business/${businessId}`, window.location.origin)
    url.searchParams.set("token", token)
    if (force) url.searchParams.set("force", "true")

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch business details via cache")
    return await res.json()
  },
}
