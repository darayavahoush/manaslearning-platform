import React from "react";

/**
 * Consistent inline SVG icons for ITW cues and accommodations.
 * Replaces system emojis with calm, uniform line icons.
 */
export default function CueIcon({ name, className = "", size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `itw-cue-svg ${className}`.trim(),
    "aria-hidden": "true",
  };

  switch (name) {
    /* --- Accommodations --- */
    case "headphones":
      return (
        <svg {...props}>
          <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
        </svg>
      );

    case "schedule":
    case "schedule-card":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 7h6M9 11h6M9 15h4" />
          <circle cx="7" cy="7" r=".75" fill="currentColor" />
          <circle cx="7" cy="11" r=".75" fill="currentColor" />
          <circle cx="7" cy="15" r=".75" fill="currentColor" />
        </svg>
      );

    case "timer":
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M10 2h4M12 2v3" />
        </svg>
      );

    case "break":
    case "break-card":
      return (
        <svg {...props}>
          <path d="M18 8h1a3 3 0 0 1 0 6h-1" />
          <path d="M4 8h14v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" />
          <path d="M7 3v2M11 3v2M15 3v2" />
        </svg>
      );

    case "communication":
    case "communication-card":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h3M7 12h3M7 16h3M14 8h3M14 12h3M14 16h3" />
        </svg>
      );

    /* --- Sensory Cue Kinds --- */
    case "announce":
      return (
        <svg {...props}>
          <path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z" />
          <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
        </svg>
      );

    case "hum":
      return (
        <svg {...props}>
          <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.6" />
          <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.6" />
        </svg>
      );

    case "tray":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="14" rx="9" ry="4" />
          <path d="M6 14c0-3 2.5-6 6-6s6 3 6 6" />
          <circle cx="12" cy="7" r="1.5" />
        </svg>
      );

    case "whir":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 9.5C12 5 15 3 17 4s0 5-2.5 5.5M14.5 12c4.5 0 6.5 3 5.5 5s-5 0-5.5-2.5M12 14.5c0 4.5-3 6.5-5 5.5s0-5 2.5-5.5M9.5 12C5 12 3 9 4 7s5 0 5.5 2.5" />
        </svg>
      );

    case "glare":
      return (
        <svg {...props}>
          <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
        </svg>
      );

    case "shout":
      return (
        <svg {...props}>
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15 9l4 6M19 9l-4 6" />
        </svg>
      );

    case "screech":
      return (
        <svg {...props}>
          <circle cx="9" cy="16" r="4" />
          <circle cx="9" cy="16" r="1.5" />
          <path d="M13 13l6-6M16 16l4-2M15 10h5" />
        </svg>
      );

    case "bell":
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );

    case "argue":
      return (
        <svg {...props}>
          <path d="M21 11.5a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V17l2.5-1.5h1.5a4 4 0 0 0 4-4z" />
          <path d="M7 14.5L4.5 16v-2.2A4 4 0 0 1 3 10.5a4 4 0 0 1 4-4h4a4 4 0 0 1 3.5 2" />
        </svg>
      );

    case "call":
      return (
        <svg {...props}>
          <path d="M18 8a6 6 0 0 0-9.33-5M15 8a3 3 0 0 0-4.67-2.5" />
          <circle cx="6" cy="15" r="3" />
          <path d="M9 15h9a3 3 0 0 0 3-3V9" />
        </svg>
      );

    case "scrape":
      return (
        <svg {...props}>
          <path d="M6 4v8h8M6 8h8M6 12l-2 8M14 12l2 8M10 12v8" />
          <path d="M17 19l3 1-3 1" />
        </svg>
      );

    case "laugh":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 13c1 2.5 3 3.5 4 3.5s3-1 4-3.5" />
          <path d="M9 9h.01M15 9h.01" strokeWidth="2.4" />
        </svg>
      );

    case "rustle":
      return (
        <svg {...props}>
          <path d="M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </svg>
      );

    case "buzzphone":
      return (
        <svg {...props}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
          <path d="M3 8a3 3 0 0 1 0 8M21 8a3 3 0 0 0 0 8" />
        </svg>
      );

    case "footsteps":
      return (
        <svg {...props}>
          <ellipse cx="8" cy="14" rx="2.5" ry="4" transform="rotate(-15 8 14)" />
          <ellipse cx="8" cy="19.5" rx="1.8" ry="1.5" transform="rotate(-15 8 19.5)" />
          <ellipse cx="16" cy="7" rx="2.5" ry="4" transform="rotate(15 16 7)" />
          <ellipse cx="16" cy="12.5" rx="1.8" ry="1.5" transform="rotate(15 16 12.5)" />
        </svg>
      );

    case "flicker":
      return (
        <svg {...props}>
          <rect x="5" y="8" width="14" height="8" rx="2" />
          <path d="M3 12h2M19 12h2M8 4l2 4M16 4l-2 4M8 20l2-4M16 20l-2-4" />
        </svg>
      );

    case "tap":
      return (
        <svg {...props}>
          <path d="M12 3v6M12 13v8M3 12h6M13 12h8" opacity="0.3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );

    case "slam":
      return (
        <svg {...props}>
          <path d="M4 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4" />
          <path d="M14 12h.01" strokeWidth="2.5" />
          <path d="M19 8l3-1M19 12h3M19 16l3 1" />
        </svg>
      );

    case "crash":
      return (
        <svg {...props}>
          <path d="M5 19l4-12 10 4-4 12z" />
          <path d="M2 20h20M9 7l-3-4M16 9l3-4" />
        </svg>
      );

    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
  }
}
