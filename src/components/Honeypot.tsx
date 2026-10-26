import { shield } from '../lib/shield'

/** Hidden field real people never fill. Bots that auto-fill every input trip it. */
export default function Honeypot() {
  return (
    <input
      className="hp-field"
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      onChange={(e) => { shield.hp = e.target.value }}
    />
  )
}
