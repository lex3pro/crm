import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="3.5" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.2" r="3.4" />
    <path d="M3.2 20c.6-3.3 2.9-5.2 5.8-5.2s5.2 1.9 5.8 5.2" />
    <path d="M15.5 5.4a3.4 3.4 0 0 1 0 5.7M17.7 14.9c1.8.7 2.9 2.4 3.2 4.6" />
  </svg>
);

export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
    <path d="M2.8 9.4h18.4M6.2 14.6h4.2" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 9.5a6 6 0 1 0-12 0c0 5.5-2.3 6.8-2.3 6.8h16.6S18 15 18 9.5Z" />
    <path d="M10.2 20a2.1 2.1 0 0 0 3.6 0" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 14.5V6a2 2 0 0 1 2-2h8.5" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.8l4.8 4.7L19.5 6.3" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20l1.2-4.2L16.6 4.4a2.15 2.15 0 0 1 3 3L8.2 18.8 4 20Z" />
    <path d="M14.5 6.5l3 3" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
    <path d="M6.5 7l.9 12.1A1.6 1.6 0 0 0 9 20.5h6a1.6 1.6 0 0 0 1.6-1.4L17.5 7" />
    <path d="M10.2 11v5.5M13.8 11v5.5" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="M20 20l-4.4-4.4" />
  </svg>
);

export const IconChevronL = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </svg>
);

export const IconChevronR = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </svg>
);

export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="M21.3 2.7L10.6 13.4M21.3 2.7l-6.8 18.6-3.9-8.3-8.3-3.9L21.3 2.7Z" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" strokeWidth={1.5} />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3.2 2" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 3.5V8h-4.5" />
  </svg>
);

export const IconWallet = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11.5a1 1 0 0 1 1 1v2" />
    <rect x="3.5" y="8" width="17" height="11" rx="2.2" />
    <circle cx="16.4" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8L2.8 19.6h18.4L12 3.8Z" />
    <path d="M12 9.8v4.4" />
    <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v15.5H7a2.5 2.5 0 0 0-2.5 2.5V5.5Z" />
    <path d="M4.5 21A2.5 2.5 0 0 1 7 18.5h12.5" />
    <path d="M9 7.5h7" />
  </svg>
);

export const IconBanknote = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.8" y="6.5" width="18.4" height="11" rx="1.8" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v.01M18 14.5v.01" strokeWidth={2.4} />
  </svg>
);

export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19V5.5M6.5 11L12 5.5 17.5 11" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10.5M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4.5 16.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
  </svg>
);

export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V4.5M7.5 9L12 4.5 16.5 9" />
    <path d="M4.5 16.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
  </svg>
);

export const IconDatabase = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
    <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
    <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
  </svg>
);

export const IconAsterisk = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v16M5.1 8l13.8 8M18.9 8L5.1 16" />
  </svg>
);
