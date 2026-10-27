/** The UGrowSMM mark (white "U" with the blue growth arrow). Sits on an orange .brand-mark tile. */
export function LogoGlyph({ size = 24 }: { size?: number }) {
  return (
    <img
      src="/icons/glyph.png?v=3"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      style={{ display: 'block' }}
    />
  )
}

/** "UGrow" in the ink colour of its surroundings + "SMM" in the logo blue. */
export function Wordmark() {
  return (
    <span className="brand-name">
      UGrow<span className="brand-accent">SMM</span>
    </span>
  )
}
