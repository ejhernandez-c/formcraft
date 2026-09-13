const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-fuchsia-500',
]

function avatarColorFor(seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

interface AvatarProps {
  seed: string
  label: string
  ariaLabel: string
}

/** Colored-initials avatar — no image upload, just the first letter of the
 * user's name on a color hashed from a stable seed (their id). Shared by
 * the dashboard's TopNavbar and the form editor's EditorNavbar. */
export function Avatar({ seed, label, ariaLabel }: AvatarProps) {
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full text-sm font-medium text-white ${avatarColorFor(seed)}`}
      title={label}
      aria-label={ariaLabel}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}
