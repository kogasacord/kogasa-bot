import { CheckResult } from "./types"

export function formatCheckResults(check: CheckResult): string {
  let str = "It might have failed because of: \n"
  for (const checks of check.reasons!) {
    switch (checks) {
      case "NOT_VIDEO":
        str += "The link not being a video.\n"
        break
      case "NOT_YOUTUBE":
        str += "The link not pointing to YouTube.\n"
        break
      case "NO_LINK":
        str += "An invalid link.\n"
        break
      case "NO_PATH_NAME":
        str += "You pointing me to the homepage.\n"
        break
      case "TOO_LONG":
        str += "The video being too long (below 2 hours is allowed).\n"
        break
      case "INVALID_FORMAT_ID":
        str += "The format ID is invalid."
        break
      default:
        str += "Unable to find the reason."
        break
    }
  }
  return str
}
