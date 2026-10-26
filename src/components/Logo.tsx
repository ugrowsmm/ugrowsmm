export function LogoGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 17v15.5c0 8 5.4 13 12 13s12-5 12-13V17"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M42.5 31 52 19M52 19h-8.5M52 19v8.5"
        stroke="#0ea5e9"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="brand-name">
      UGrow<span className="brand-accent">SMM</span>
    </span>
  )
}
