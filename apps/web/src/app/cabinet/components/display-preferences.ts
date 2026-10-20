export interface DisplayPreferences {
  showTitle: boolean
  showDescription: boolean
  showImage: boolean
  showWebsite: boolean
  showFolder: boolean
  showDate: boolean
}

export const defaultDisplayPreferences: DisplayPreferences = {
  showTitle: true,
  showDescription: true,
  showImage: true,
  showWebsite: true,
  showFolder: true,
  showDate: true,
}
