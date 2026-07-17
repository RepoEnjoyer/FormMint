import type { ReactNode, SVGProps } from 'react';

export type IconName = 'box' | 'check' | 'chevron' | 'copy' | 'download' | 'external' | 'file' | 'folder' | 'image' | 'info' | 'menu' | 'plus' | 'refresh' | 'save' | 'shield' | 'sliders' | 'spark' | 'trash' | 'upload' | 'wallet' | 'x';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactNode> = {
  box: <><path d="m4 7 8-4 8 4-8 4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/></>,
  external: <><path d="M14 4h6v6M10 14 20 4"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></>,
  file: <><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  folder: <path d="M3 6h7l2 2h9v11H3Z"/>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></>,
  save: <><path d="M5 3h12l2 2v16H5Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></>,
  spark: <><path d="m12 3 1.4 4.1 4.1 1.4-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
  upload: <><path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 20h16"/></>,
  wallet: <><path d="M4 6h15v14H4Z"/><path d="M4 6V4h12v2M14 11h7v5h-7a2.5 2.5 0 0 1 0-5Z"/></>,
  x: <path d="m6 6 12 12M18 6 6 18"/>,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {paths[name]}
    </svg>
  );
}
