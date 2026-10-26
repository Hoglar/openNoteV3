import type { PointerEvent } from 'react';

export function HomePage() {
  function updateGlow(event: PointerEvent<HTMLHeadingElement>) {
    const heading = event.currentTarget;
    const bounds = heading.getBoundingClientRect();
    heading.style.setProperty('--glow-x', `${event.clientX - bounds.left}px`);
    heading.style.setProperty('--glow-y', `${event.clientY - bounds.top}px`);
  }

  return (
    <div className="home-page">
      <h1 className="action-word" onPointerEnter={updateGlow} onPointerMove={updateGlow}>
        ACTION
      </h1>
    </div>
  );
}
