export type OriginAdUnit = {
  id: string
  source: string
  content: string
  enabled: boolean
}

export type OriginAdsBody = {
  beforePost?: OriginAdUnit | null
  afterPost?: OriginAdUnit | null
  inPost?: OriginAdUnit[]
}

export type OriginAdsScript = {
  adsBody?: OriginAdsBody
  adsHeader?: OriginAdUnit[]
  adsFooter?: OriginAdUnit[]
  adsLeftSidebar?: OriginAdUnit[]
  adsRightSidebar?: OriginAdUnit[]
  adsVideoHeader?: OriginAdUnit | null
}

export type OriginAds = {
  adsTxt?: string
  adsScript?: OriginAdsScript
}

export type OriginStaticPage = {
  id: string
  name: string
  slug: string
}

export type OriginCategory = {
  id: number | string
  name: string
  slug: string
}

export type OriginScript = {
  id: string
  src: string
  async?: boolean
  defer?: boolean
  crossOrigin?: string
  strategy?: string
  enabled?: boolean
}

export type OriginVerification = {
  google?: string
  yandex?: string
  yahoo?: string
  other?: Record<string, string>
}

export type OriginSeo = {
  title?: string
  description?: string
}

export type OriginSiteConfig = {
  colorHeader?: string
  colorTextHeader?: string
  visibledBreadcrumb?: boolean
  customOpengraphImage?: boolean
  enabledAds?: boolean
  primaryColor?: string
  accentColor?: string
}

export type OriginAnalytics = {
  gaId?: string
  gtmId?: string
}

export type OriginSocials = {
  facebook?: string
  instagram?: string
  threads?: string
  x?: string
  tiktok?: string
  youtube?: string
  telegram?: string
  reddit?: string
  pinterest?: string
  discord?: string
  whatsapp?: string
  snapchat?: string
  twitch?: string
  linkedin?: string
}

export type OriginDocument = {
  _id: string
  origin: string
  createdAt?: string | null
  updatedAt?: string | null
  totalItems?: number
  ads?: OriginAds
  icon?: string
  logo?: string
  pages?: OriginStaticPage[]
  script?: OriginScript[]
  verification?: OriginVerification
  seo?: OriginSeo
  categories?: OriginCategory[]
  config?: OriginSiteConfig
  analytics?: OriginAnalytics
  socials?: OriginSocials
  networks?: string[]
}

export type OriginListItem = {
  _id: string
  origin: string
  totalItems: number
  updatedAt: string | null
  icon: string
  enabledAds: boolean
}

export const ORIGIN_PATCH_SECTIONS = [
  "identity",
  "seo",
  "verification",
  "analytics",
  "config",
  "socials",
  "pages",
  "categories",
  "script",
  "networks",
  "adsTxt",
  "adsScript",
] as const

export type OriginPatchSection = (typeof ORIGIN_PATCH_SECTIONS)[number]
