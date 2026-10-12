import type {MetadataRoute} from 'next';
import {isSearchIndexable, publicPagePaths, siteUrl} from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSearchIndexable) return [];
  return publicPagePaths.map(path => ({url:new URL(path,siteUrl).href}));
}
