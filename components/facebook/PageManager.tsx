'use client'

import AssetExplorerComponent from "./AssetExplorer/AssetExplorer"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function PageManager({ adminPassword, isAdminVerified }: Props) {
  return <AssetExplorerComponent adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
}
