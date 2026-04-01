import { FacebookPage } from "@/types/facebook"

const LIMIT = 200

export const facebookPageService = {
  async getPages(token: string): Promise<FacebookPage[]> {
    const url = new URL("https://graph.facebook.com/me/accounts")
    url.searchParams.set("fields", "id,name,access_token,category,tasks,business")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", LIMIT.toString())

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error("Failed to fetch Facebook pages")
    }

    const data = (await res.json()) as { data?: FacebookPage[]; error?: { message?: string } }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    return data.data ?? []
  },

  async getPageTokenFromMeAccounts(token: string, pageId: string): Promise<string> {
    const pages = await this.getPages(token)
    const page = pages.find((p) => p.id === pageId)
    if (!page?.access_token) {
      throw new Error(
        `Page ${pageId} not found in /me/accounts. Assign the page to this account first.`
      )
    }
    return page.access_token
  },

  async getPageInfo(
    token: string,
    pageId: string,
    pageAccessToken?: string
  ): Promise<{
    id: string
    name?: string
    about?: string
    description?: string
    category?: string
    category_list?: Array<{ id: string; name: string }>
    website?: string
    phone?: string
    location?: { street?: string; city?: string; zip?: string; country?: string }
    emails?: string[]
  }> {
    const pageToken = pageAccessToken ?? (await this.getPageTokenFromMeAccounts(token, pageId))
    const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(pageId)}`)
    url.searchParams.set(
      "fields",
      "id,name,about,description,category,category_list,website,phone,location,emails"
    )
    url.searchParams.set("access_token", pageToken)

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch page info")

    const data = (await res.json()) as {
      id?: string
      name?: string
      about?: string
      description?: string
      category?: string
      category_list?: Array<{ id: string; name: string }>
      website?: string
      phone?: string
      location?: { street?: string; city?: string; zip?: string; country?: string }
      emails?: string[]
      error?: { message?: string }
    }
    if (data.error?.message) throw new Error(data.error.message)

    const loc = data.location
    let flatLoc: { street?: string; city?: string; zip?: string; country?: string } | undefined
    if (loc && typeof loc === "object") {
      if ("street" in loc || "city" in loc || "zip" in loc || "country" in loc) {
        flatLoc = loc as { street?: string; city?: string; zip?: string; country?: string }
      } else if ("location" in loc && loc.location && typeof loc.location === "object") {
        flatLoc = (
          loc as { location: { street?: string; city?: string; zip?: string; country?: string } }
        ).location
      }
    }

    let emails: string[] | undefined
    if (Array.isArray(data.emails)) {
      emails = data.emails.filter((e): e is string => typeof e === "string")
    } else if (data.emails != null && data.emails !== "") {
      emails = [String(data.emails)]
    }

    let categoryList: Array<{ id: string; name: string }> | undefined
    if (Array.isArray(data.category_list)) {
      categoryList = data.category_list
        .filter(
          (c): c is { id: string; name: string } =>
            c && typeof c.id === "string" && typeof c.name === "string"
        )
        .map((c) => ({ id: c.id, name: c.name }))
    }

    return {
      id: data.id ?? pageId,
      name: data.name,
      about: data.about,
      description: data.description,
      category: data.category,
      category_list: categoryList,
      website: data.website,
      phone: data.phone,
      location: flatLoc,
      emails,
    }
  },

  async updatePageInfo(
    token: string,
    pageId: string,
    updates: {
      about?: string
      description?: string
      category?: string
      website?: string
      phone?: string
      location?: { street?: string; city?: string; zip?: string; country?: string }
      email?: string
    },
    pageAccessToken?: string
  ): Promise<void> {
    const pageToken = pageAccessToken ?? (await this.getPageTokenFromMeAccounts(token, pageId))
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(pageId)}`
    const body = new FormData()
    body.append("access_token", pageToken)
    if (updates.about !== undefined) body.append("about", updates.about)
    if (updates.description !== undefined) body.append("description", updates.description)
    if (updates.category !== undefined) body.append("category", updates.category)
    if (updates.website !== undefined) body.append("website", updates.website)
    if (updates.phone !== undefined) body.append("phone", updates.phone)
    if (updates.email !== undefined) {
      body.append("email", updates.email)
      body.append("emails", JSON.stringify([updates.email]))
    }
    if (updates.location !== undefined) {
      const loc = updates.location
      if (loc.street !== undefined) body.append("location[street]", loc.street)
      if (loc.city !== undefined) body.append("location[city]", loc.city)
      if (loc.zip !== undefined) body.append("location[zip]", loc.zip)
      if (loc.country !== undefined) body.append("location[country]", loc.country)
    }

    const res = await fetch(url, { method: "POST", body })
    const data = (await res.json()) as { success?: boolean; error?: { message?: string } }
    if (data.error?.message) throw new Error(data.error.message)
  },
}
