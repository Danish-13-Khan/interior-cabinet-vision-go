/** Tiny looping SVG clips for "How it works". Motion lives in styles/motion.css and stops for reduced motion. */
export function MeasureClip() {
  return (
    <svg viewBox="0 0 160 100" className="clip clip-measure" aria-hidden="true">
      <path className="clip-wall" pathLength={1} d="M24 80V20h112v60H96" />
      <path className="clip-dim" d="M24 12h112M24 8v8M136 8v8" />
      <circle className="clip-pen" r="3.5" cx="96" cy="80" />
    </svg>
  )
}

export function RunClip() {
  return (
    <svg viewBox="0 0 160 100" className="clip clip-run" aria-hidden="true">
      <path className="clip-floor" d="M16 84h128" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className="clip-box" x={20 + i * 30} y={48} width={28} height={34} rx={2} style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      <rect className="clip-top" x={18} y={44} width={124} height={4} rx={1} />
    </svg>
  )
}

export function ProposalClip() {
  return (
    <svg viewBox="0 0 160 100" className="clip clip-proposal" aria-hidden="true">
      <rect className="clip-sheet" x={40} y={10} width={80} height={80} rx={4} />
      {[0, 1, 2].map((i) => (
        <path key={i} className="clip-line" pathLength={1} d={`M52 ${32 + i * 12}h${44 - i * 8}`} style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <rect className="clip-price" x={70} y={68} width={40} height={14} rx={7} />
    </svg>
  )
}

export function HandoffClip() {
  return (
    <svg viewBox="0 0 160 100" className="clip clip-handoff" aria-hidden="true">
      <rect className="clip-sheet" x={16} y={26} width={40} height={48} rx={3} />
      <path className="clip-arrow" d="M66 50h28m-8-8 8 8-8 8" />
      <path className="clip-shop" d="M104 78V40l14-10 14 10 14-10v48z" />
      <rect className="clip-packet" x={24} y={40} width={24} height={20} rx={2} />
    </svg>
  )
}
