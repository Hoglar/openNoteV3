type IconName = 'brand' | 'notes' | 'network' | 'login' | 'logout';

export function Icon({ name }: { name: IconName }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'brand' && <><path d="m12 2 9 5v10l-9 5-9-5V7Z" /><path d="M8.5 16V8l7 8V8" /></>}
      {name === 'notes' && <><path d="M6 3.5h10l3 3V21H6Z" /><path d="M15 3.5V8h4M9 12h7M9 16h5M3 7v12" /></>}
      {name === 'network' && <><path d="m6 7 10-2M6 7l5 11M16 5l-5 13M16 5l4 11M11 18l9-2" /><circle cx="6" cy="7" r="2.5" /><circle cx="16" cy="5" r="2" /><circle cx="11" cy="18" r="2.5" /><circle cx="20" cy="16" r="2" /></>}
      {(name === 'login' || name === 'logout') && <>
        <path d="M14 4h6v16h-6" />
        {name === 'login' ? <path d="M3 12h12m-4-4 4 4-4 4" /> : <path d="M15 12H3m4-4-4 4 4 4" />}
      </>}
    </svg>
  );
}
