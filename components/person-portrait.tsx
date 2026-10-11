'use client';

import {useState} from 'react';
import Image from 'next/image';
import './person-portrait.css';

type PersonPortraitProps = {
  name: string;
  role: string;
  image?: string;
  webp?: string;
  alt?: string;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
};

export function PersonPortrait({name, role, image, webp, alt, imageWidth = 800, imageHeight = 800, className = ''}: PersonPortraitProps) {
  const [failedImage, setFailedImage] = useState<string>();
  const words = name.split(',')[0].trim().split(/\s+/);
  const initials = `${words[0]?.[0] ?? ''}${words.length > 1 ? words.at(-1)?.[0] ?? '' : ''}`.toLocaleUpperCase();
  const description = alt ?? `${name}, ${role}`;

  return <span className={`person-portrait ${className}`}>
    {image && failedImage !== image ? <picture>
      {webp && <source srcSet={webp.split('/').map(encodeURIComponent).join('/')} type="image/webp" />}
      <Image src={image} alt={description} width={imageWidth} height={imageHeight} loading="lazy" unoptimized
        onError={() => setFailedImage(image)} />
    </picture> : <span className="person-portrait-fallback" role="img" aria-label={description}>
      <span aria-hidden="true">{initials}</span>
    </span>}
  </span>;
}
