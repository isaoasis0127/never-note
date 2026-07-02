export default function GiraffeLogo({ size = 32, color = "#2C1810", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Minimal giraffe silhouette: head tilted forward over a long neck. */}
      <path
        d="M27 4c-1.6 0-3 1.2-3.3 2.8l-.4 2.1c-1.7.4-3 1.9-3 3.7 0 1 .4 1.9 1 2.6-1.1 1-1.8 2.5-1.8 4.1 0 1.4.5 2.6 1.3 3.6-2.8 4.2-4.3 10-4.3 16.4v14.1c0 1.2.4 2.3 1.1 3.2l-3.4 5.9a1.8 1.8 0 0 0 1.6 2.7h3.1a1.8 1.8 0 0 0 1.6-1l2.6-5.2c.5.1 1 .1 1.5.1h1v4.3c0 1 .8 1.8 1.8 1.8h2.8c1 0 1.8-.8 1.8-1.8v-4.6c1.9-.6 3.5-1.8 4.7-3.4l3 5.9a1.8 1.8 0 0 0 1.6 1h3.1a1.8 1.8 0 0 0 1.6-2.7l-3.7-6.5c.3-.8.5-1.7.5-2.7V39.3c0-4.6-.9-9-2.6-12.6.6-.9.9-1.9.9-3 0-1.7-.8-3.3-2-4.3.4-.7.7-1.5.7-2.4 0-1.9-1.4-3.4-3.2-3.7l-.4-2C33 5.2 31.6 4 30 4h-3z"
        fill={color}
      />
      <circle cx="30.5" cy="12.5" r="1.3" fill="#FFFDF5" />
    </svg>
  );
}
