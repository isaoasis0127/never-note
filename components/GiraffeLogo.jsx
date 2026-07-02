export default function GiraffeLogo({ size = 32, color = "#2C1810", spotColor = "#FFFDF5", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Full-body giraffe silhouette: legs, body, tail, long spotted
          neck, head with snout/ears/ossicones. Built from simple
          shapes (rather than one hand-tuned path) so it stays a
          recognizable giraffe even at small icon sizes. */}
      <rect x="22" y="46" width="4" height="14" rx="2" fill={color} />
      <rect x="30" y="46" width="4" height="14" rx="2" fill={color} />
      <rect x="38" y="46" width="4" height="14" rx="2" fill={color} />
      <ellipse cx="30" cy="42" rx="14" ry="9" fill={color} />
      <path d="M16 38 q-6 2 -5 10" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M38 36 C40 26 40 18 44 10 L50 10 C48 18 48 26 46 38 Z" fill={color} />
      <ellipse cx="47" cy="9" rx="7" ry="5" fill={color} />
      <ellipse cx="52.5" cy="10.5" rx="3.5" ry="3" fill={color} />
      <ellipse cx="42" cy="5" rx="2.2" ry="3.5" fill={color} transform="rotate(-30 42 5)" />
      <ellipse cx="51" cy="3.5" rx="2.2" ry="3.5" fill={color} transform="rotate(20 51 3.5)" />
      <circle cx="44.5" cy="2" r="1.6" fill={color} />
      <circle cx="49" cy="1.5" r="1.6" fill={color} />
      <circle cx="48.5" cy="8.5" r="1" fill={spotColor} />
      <circle cx="43" cy="20" r="2.2" fill={spotColor} />
      <circle cx="41" cy="30" r="2" fill={spotColor} />
      <circle cx="33" cy="40" r="2.4" fill={spotColor} />
    </svg>
  );
}
