export function GoldenRunVisual() {
  return (
    <div className="golden-run-visual" aria-hidden="true">
      <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" width="100%">
        <defs>
          <linearGradient id="calm-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dba8a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7dba8a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="360" height="240" fill="#161616" rx="4" />
        <circle cx="50" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="42" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          1
        </text>
        <line x1="72" y1="120" x2="118" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="140" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="132" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          2
        </text>
        <line x1="162" y1="120" x2="208" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="230" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="222" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          3
        </text>
        <line x1="252" y1="120" x2="298" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="320" cy="120" r="22" fill="#7dba8a" />
        <text x="312" y="124" fill="#0f1a12" fontSize="11" fontFamily="IBM Plex Sans,sans-serif" fontWeight="600">
          4
        </text>
        <text x="28" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Room
        </text>
        <text x="112" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Run
        </text>
        <text x="200" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Proposal
        </text>
        <text x="292" y="170" fill="#9fd4a8" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Shop
        </text>
        <rect x="20" y="30" width="320" height="40" rx="8" fill="url(#calm-g1)" stroke="#2a2a2a" />
        <text x="40" y="55" fill="#a8a8a8" fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Golden run · same design end-to-end
        </text>
      </svg>
    </div>
  )
}
