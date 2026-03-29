export {}

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: FacebookSDK
  }
}

interface FacebookSDK {
  init: (options: {
    appId?: string
    cookie?: boolean
    xfbml?: boolean
    version?: string
  }) => void

  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string }
  ) => void

  getLoginStatus: (
    callback: (response: FacebookLoginResponse) => void
  ) => void

  api: <T = unknown>(
    path: string,
    params: Record<string, unknown>,
    callback: (response: T) => void
  ) => void

  XFBML: {
    parse: (element?: HTMLElement) => void
  }
}

interface FacebookLoginResponse {
  status: "connected" | "not_authorized" | "unknown"
  authResponse?: {
    accessToken: string
    expiresIn: number
    userID: string
  }
}

export interface FacebookUser {
  id: string
  name: string
}

export interface SystemUser {
  _id?: string
  id: string
  name: string
  email?: string
  token?: string
  appName?: string
  businessId?: string
  businessName?: string
  category?: string
  roleCode?: string
  role?: "Admin" | "Employee" | "admin" | "employee" | string
  description?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  status?: "Active" | "Disabled"
}

export interface FacebookPage {
  id: string
  name?: string
  access_token?: string
  category?: string
  topic?: string
  category_list?: Array<{ id: string; name: string }>
  about?: string
  description?: string
  website?: string
  emails?: string[]
  phone?: string
  tasks?: string[]
  source?: "owned" | "client" | "asset_group"
  location?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

export interface FacebookBusiness {
  id: string
  name: string
  permitted_roles?: string[]
  verification_status?: string
  is_promotable?: boolean;
  sharing_eligibility_status?: string;
  can_create_ad_accounts?: boolean;
  created_time?: string;
  primary_page?: { id: string; name: string };
  timezone_id?: number;
  vertical?: string;
  extendedcredits?: {
    data: Array<{
      id: string;
      max_line_of_credit: string;
      receivable_amount: string;
    }>;
  };
  owned_ad_accounts?: {
    data: Array<{
      id: string;
      name: string;
      account_status: number;
      amount_spent: string;
      currency: string;
    }>;
  };
  adspixels?: { data: { id: string; name: string }[] };
  whatsapp_business_accounts?: { data: { id: string; name: string; status: string }[] };
  business_users?: { data: { id: string; name: string; email: string; role: string }[] };
  business_asset_groups?: { data: { id: string; name: string }[] };
}

export interface BusinessRow extends FacebookBusiness {
  pages: FacebookPage[]
  assignedPageIds: string[]
  apps?: Array<{ 
    id: string; 
    name: string; 
    category?: string; 
    link?: string; 
    icon_url?: string; 
    source?: "owned" | "client" | "pending";
    daily_active_users?: string | number;
    weekly_active_users?: string | number;
    monthly_active_users?: string | number;
    app_install_tracked?: boolean;
    permitted_tasks?: string[];
  }>
  system_users?: { id: string; name: string; role: string }[]
  business_asset_groups?: { data: { id: string; name: string }[] }
}

export interface BusinessPageRow extends FacebookPage {
  businessId: string
  businessName: string
  pageSource: "owned" | "client"
}
