'use client';

import { useEffect, useRef, useState } from 'react';

const links = [['story', 'Story'], ['team', 'Team'], ['values', 'Values'], ['contact', 'Contact']] as const;

export function AboutNavigation() {
  const [active, setActive] = useState<string>('story');
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const threshold = (nav.current?.getBoundingClientRect().bottom ?? 0) + 40;
      let current: string = 'story';
      for (const [id] of links) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= threshold) current = id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = 'contact';
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, []);
  return <nav ref={nav} className="about-nav" aria-label="On this page">
    {links.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
  </nav>;
}
