function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null && "$date" in value) {
    const raw = (value as { $date: string | number | Date }).$date
    return new Date(raw).toISOString()
  }
  return null
}

function toId(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null && "$oid" in value) {
    return String((value as { $oid: string }).$oid)
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString(): string }).toString()
  }
  return String(value)
}

export function serializeOriginListItem(doc: Record<string, unknown>) {
  const config = (doc.config ?? {}) as { enabledAds?: boolean }
  return {
    _id: toId(doc._id),
    origin: String(doc.origin ?? ""),
    totalItems: typeof doc.totalItems === "number" ? doc.totalItems : 0,
    updatedAt: toIso(doc.updatedAt),
    icon: typeof doc.icon === "string" ? doc.icon : "",
    enabledAds: Boolean(config.enabledAds),
  }
}

export function serializeOrigin(doc: Record<string, unknown>) {
  const { _id, createdAt, updatedAt, ...rest } = doc
  return {
    ...rest,
    _id: toId(_id),
    createdAt: toIso(createdAt),
    updatedAt: toIso(updatedAt),
  }
}
