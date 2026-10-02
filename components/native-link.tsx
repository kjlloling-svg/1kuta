import type { ComponentProps } from 'react';

/** Native navigation avoids the broken client-side Link runtime in this Site build. */
export default function Link(props: ComponentProps<'a'> & { href: string }) {
  return <a {...props} />;
}
