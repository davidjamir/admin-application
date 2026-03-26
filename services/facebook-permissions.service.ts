import { facebookAssignmentService } from "./facebook-assignment.service"
import { facebookOwnershipService } from "./facebook-ownership.service"

export const facebookPermissionsService = {
  ...facebookAssignmentService,
  ...facebookOwnershipService,
}
