import type {MetadataRoute} from 'next';
import {isSearchIndexable, siteUrl} from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexable) return {rules:{userAgent:'*',disallow:'/'}};
  return {
    rules:{userAgent:'*',allow:'/',disallow:'/api/'},
    sitemap:`${siteUrl}/sitemap.xml`,
  };
}
