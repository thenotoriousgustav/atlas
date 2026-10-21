export interface DisplayPreferences {
  density: "comfortable" | "compact"
  showTitle: boolean
  showDescription: boolean
  showImage: boolean
  showWebsite: boolean
  showFolder: boolean
  showDate: boolean
}

export const defaultDisplayPreferences: DisplayPreferences = {
  density: "comfortable",
  showTitle: true,
  showDescription: true,
  showImage: true,
  showWebsite: true,
  showFolder: true,
  showDate: true,
}
