export default function LogoIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* Background card (tilted left, lower opacity) */}
      <path 
        d="M5.5 8.5L3.5 16.5C3 18 4 19.5 5.5 19.5H13" 
        stroke="currentColor" 
        strokeOpacity="0.45"
      />
      {/* Middle card (tilted, medium opacity) */}
      <rect 
        x="6" 
        y="4" 
        width="11" 
        height="15" 
        rx="1.5" 
        transform="rotate(-6 6 4)" 
        stroke="currentColor" 
        strokeOpacity="0.7"
      />
      {/* Front card (straight, highlighted with fill) */}
      <rect 
        x="9" 
        y="2" 
        width="12" 
        height="16" 
        rx="2" 
        fill="currentColor" 
        fillOpacity="0.08"
        stroke="currentColor"
      />
      {/* Glowing sizing indicator inside front card */}
      <path 
        d="M13.5 10L15 11.5L18.5 8" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ color: 'var(--accent-cyan)' }}
      />
    </svg>
  );
}
