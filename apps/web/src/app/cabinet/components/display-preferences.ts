export type Density = "comfortable" | "compact" | "visual"

export const densityOptions: { value: Density; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  // Gallery cards: the preview fills the card and only the title sits below it. List view treats it as comfortable.
  { value: "visual", label: "Visual" },
]

export const isDensity = (value: unknown): value is Density =>
  densityOptions.some((option) => option.value === value)

export interface DisplayPreferences {
  density: Density
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
