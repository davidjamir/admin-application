import { facebookCoreService } from "./facebook-core.service"
import { facebookBusinessService } from "./facebook-business.service"
import { facebookPageService } from "./facebook-page.service"
import { facebookPermissionsService } from "./facebook-permissions.service"

export const facebookService = {
  ...facebookCoreService,
  ...facebookBusinessService,
  ...facebookPageService,
  ...facebookPermissionsService,
}
