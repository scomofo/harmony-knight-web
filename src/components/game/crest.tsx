export function KnightCrest({ size = 88 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      aria-hidden="true"
      className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <path
        d="M44 6 L74 18 V46 C74 64 60 76 44 82 C28 76 14 64 14 46 V18 Z"
        fill="#14181f"
        stroke="#8fa3b0"
        strokeWidth="2"
      />
      <path d="M24 34 H64" stroke="#e8e4dc" strokeOpacity="0.35" />
      <path d="M24 40 H64" stroke="#e8e4dc" strokeOpacity="0.35" />
      <path d="M24 46 H64" stroke="#e8e4dc" strokeOpacity="0.35" />
      <path d="M24 52 H64" stroke="#e8e4dc" strokeOpacity="0.35" />
      <path d="M24 58 H64" stroke="#e8e4dc" strokeOpacity="0.35" />
      <text x="22" y="58" fill="#e8e4dc" fontSize="22" fontFamily="Georgia, serif" opacity="0.85">
        𝄞
      </text>
      <circle cx="48" cy="40" r="4.2" fill="#E53935" />
      <rect x="56" y="43" width="8" height="8" fill="#FF6F00" />
      <polygon points="42,52 48,63 36,63" fill="#E8C547" />
      <polygon points="52,56 58,62 52,68 46,62" fill="#2E7D32" />
    </svg>
  );
}
