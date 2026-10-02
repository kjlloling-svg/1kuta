import {cookies} from 'next/headers';
import {themeConfig,themeBootstrapScript} from '@/lib/theme.mjs';
import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';
import { Header, Footer } from '@/components/site-shell';
import './globals.css';
import {ScrollProgress} from '@/components/scroll-progress';
// Every page header reflects the current local session.
export const dynamic='force-dynamic';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};
const inter=localFont({src:[{path:'../public/assets/inter-2.woff2',weight:'400'},{path:'../public/assets/inter-4.woff2',weight:'600'},{path:'../public/assets/inter-5.woff2',weight:'700'}],variable:'--font-inter',display:'swap'});
export const metadata: Metadata = { title: { default:'SLSU Gumaca Research Archive', template:'%s | SLSU Gumaca Research Archive' }, description:'Explore the SLSU Gumaca Campus Research Paper Compiler and Digital Archive. Search research records by title, author, program, keyword, and year.', robots:{index:false,follow:false}, icons:{icon:'/favicon.svg'} };
export default async function RootLayout({children}: Readonly<{children:React.ReactNode}>) { const stored=(await cookies()).get(themeConfig.cookie)?.value;const theme=stored==='dark'?'dark':'light';return <html lang="en" className={inter.variable} data-theme={theme} suppressHydrationWarning><head><meta name="color-scheme" content="light dark"/><script dangerouslySetInnerHTML={{__html:themeBootstrapScript}}/></head><body><ScrollProgress/><a className="skip-link" href="#main">Skip to content</a><Header initialTheme={theme}/>{children}<Footer /></body></html>; }

