import { z } from "zod"
import { ORIGIN_PATCH_SECTIONS } from "@/types/origin"

const adUnitSchema = z.object({
  id: z.string().nullish().transform((v) => v ?? ""),
  source: z.string().nullish().transform((v) => v ?? ""),
  content: z.string().nullish().transform((v) => v ?? ""),
  enabled: z.boolean().nullish().transform((v) => Boolean(v)),
})

const adUnitOptional = adUnitSchema.nullable().optional()

const adsScriptSchema = z.object({
  adsBody: z
    .object({
      beforePost: adUnitOptional,
      afterPost: adUnitOptional,
      inPost: z.array(adUnitSchema).nullish().transform((v) => v ?? []),
    })
    .nullish()
    .transform((v) => v ?? { inPost: [] }),
  adsHeader: z.array(adUnitSchema).nullish().transform((v) => v ?? []),
  adsFooter: z.array(adUnitSchema).nullish().transform((v) => v ?? []),
  adsLeftSidebar: z.array(adUnitSchema).nullish().transform((v) => v ?? []),
  adsRightSidebar: z.array(adUnitSchema).nullish().transform((v) => v ?? []),
  adsVideoHeader: adUnitOptional,
})

const pageSchema = z.object({
  id: z.union([z.string(), z.number()]).nullish().transform((v) => String(v ?? "")),
  name: z.string().nullish().transform((v) => v ?? ""),
  slug: z.string().nullish().transform((v) => v ?? ""),
})

const categorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().nullish().transform((v) => v ?? ""),
  slug: z.string().nullish().transform((v) => v ?? ""),
})

const scriptSchema = z.object({
  id: z.string().nullish().transform((v) => v ?? ""),
  src: z.string().nullish().transform((v) => v ?? ""),
  async: z.boolean().nullish().transform((v) => Boolean(v)),
  defer: z.boolean().nullish().transform((v) => Boolean(v)),
  crossOrigin: z.string().nullish().transform((v) => v ?? ""),
  strategy: z.string().nullish().transform((v) => v ?? ""),
  enabled: z.boolean().nullish().transform((v) => Boolean(v)),
})

const payloadBySection = {
  identity: z.object({
    origin: z.string().min(1).optional(),
    icon: z.string().nullish().transform((v) => v ?? ""),
    logo: z.string().nullish().transform((v) => v ?? ""),
  }),
  seo: z.object({
    title: z.string().nullish().transform((v) => v ?? ""),
    description: z.string().nullish().transform((v) => v ?? ""),
  }),
  verification: z.object({
    google: z.string().nullish().transform((v) => v ?? ""),
    yandex: z.string().nullish().transform((v) => v ?? ""),
    yahoo: z.string().nullish().transform((v) => v ?? ""),
    other: z
      .record(z.string(), z.string().nullish().transform((v) => v ?? ""))
      .nullish()
      .transform((v) => v ?? {}),
  }),
  analytics: z.object({
    gaId: z.string().nullish().transform((v) => v ?? ""),
    gtmId: z.string().nullish().transform((v) => v ?? ""),
  }),
  config: z.object({
    colorHeader: z.string().nullish().transform((v) => v ?? ""),
    colorTextHeader: z.string().nullish().transform((v) => v ?? ""),
    visibledBreadcrumb: z.boolean().nullish().transform((v) => Boolean(v)),
    customOpengraphImage: z.boolean().nullish().transform((v) => Boolean(v)),
    enabledAds: z.boolean().nullish().transform((v) => Boolean(v)),
    primaryColor: z.string().nullish().transform((v) => v ?? ""),
    accentColor: z.string().nullish().transform((v) => v ?? ""),
  }),
  socials: z
    .record(z.string(), z.string().nullish().transform((v) => v ?? ""))
    .nullish()
    .transform((v) => v ?? {}),
  pages: z.array(pageSchema).nullish().transform((v) => v ?? []),
  categories: z.array(categorySchema).nullish().transform((v) => v ?? []),
  script: z.array(scriptSchema).nullish().transform((v) => v ?? []),
  networks: z.array(z.string()).nullish().transform((v) => v ?? []),
  adsTxt: z.string().nullish().transform((v) => v ?? ""),
  adsScript: adsScriptSchema,
} as const

const patchBodySchema = z.object({
  section: z.enum(ORIGIN_PATCH_SECTIONS),
  data: z.unknown(),
})

export type OriginPatchBody = z.infer<typeof patchBodySchema>

export function parseOriginPatch(body: unknown): { section: OriginPatchBody["section"]; set: Record<string, unknown> } {
  const parsed = patchBodySchema.parse(body)
  const schema = payloadBySection[parsed.section]
  const data = schema.parse(parsed.data)

  const set: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  switch (parsed.section) {
    case "identity": {
      const identity = data as z.infer<typeof payloadBySection.identity>
      if (identity.origin !== undefined) set.origin = identity.origin.trim()
      if (identity.icon !== undefined) set.icon = identity.icon
      if (identity.logo !== undefined) set.logo = identity.logo
      break
    }
    case "seo":
      set.seo = data
      break
    case "verification":
      set.verification = data
      break
    case "analytics":
      set.analytics = data
      break
    case "config":
      set.config = data
      break
    case "socials":
      set.socials = data
      break
    case "pages":
      set.pages = data
      break
    case "categories":
      set.categories = data
      break
    case "script":
      set.script = data
      break
    case "networks":
      set.networks = data
      break
    case "adsTxt":
      set["ads.adsTxt"] = data
      break
    case "adsScript":
      set["ads.adsScript"] = data
      break
  }

  return { section: parsed.section, set }
}
