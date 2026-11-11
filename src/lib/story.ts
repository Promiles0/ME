/** Shared handle so the hero's "blast" button can reach the story particle layer. */
export const storyField: { current: { burst: () => void } | null } = { current: null }
