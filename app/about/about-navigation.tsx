'use client';

import { useEffect, useRef, useState } from 'react';

const links = [['story', 'Story'], ['team', 'Team'], ['values', 'Values'], ['contact', 'Contact']] as const;

export function AboutNavigation() {
  const [active, setActive] = useState<string>('story');
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      const visible = new Set<string>();
      const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const offset = header + (nav.current?.getBoundingClientRect().height ?? 0);
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = [...links].reverse().find(([id]) => visible.has(id));
        if (current) setActive(current[0]);
      }, { rootMargin: `-${offset}px 0px -40% 0px`, threshold: 0 });
      for (const [id] of links) {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      }
    };
    observe();
    window.addEventListener('resize', observe, { passive: true });
    return () => { observer?.disconnect(); window.removeEventListener('resize', observe); };
  }, []);
  return <nav ref={nav} className="about-nav" aria-label="On this page">
    {links.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setActive(id)} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
  </nav>;
}
