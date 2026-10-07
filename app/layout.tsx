import {cookies} from 'next/headers';
import {colorVisionBootstrapScript} from '@/lib/color-vision.mjs';
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
// Casual shortcut deterrent only; server-side permissions remain the security boundary.
const browserShortcutScript = `
function disableDevTools() {
  const enabled = true; // Set to false and redeploy to restore normal browser shortcuts.
  if (!enabled) return;
  document.addEventListener('keydown', function (event) {
    // Do not interfere with international-keyboard text entry.
    if (event.getModifierState('AltGraph')) return;
    const key = event.key.toLowerCase();
    if (event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && !event.altKey && key === 'i') ||
        (event.ctrlKey && event.shiftKey && !event.altKey && key === 'j') ||
        (event.ctrlKey && event.shiftKey && !event.altKey && key === 'c') ||
        (event.ctrlKey && event.shiftKey && !event.altKey && key === 'k') ||
        (event.ctrlKey && event.altKey && !event.shiftKey && key === 'j') ||
        (event.ctrlKey && event.altKey && !event.shiftKey && key === 'u') ||
        (event.ctrlKey && !event.shiftKey && !event.altKey && key === 'u')) event.preventDefault();
  }, true);
  // Cancels the whole page context menu, including its normal copy/link actions.
  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  }, true);
}
disableDevTools();
`;
export default async function RootLayout({children}: Readonly<{children:React.ReactNode}>) { const stored=(await cookies()).get(themeConfig.cookie)?.value;const theme=stored==='dark'?'dark':'light';return <html lang="en" className={inter.variable} data-theme={theme} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:browserShortcutScript}}/><meta name="color-scheme" content="light dark"/><script dangerouslySetInnerHTML={{__html:themeBootstrapScript}}/><script dangerouslySetInnerHTML={{__html:colorVisionBootstrapScript}}/></head><body><ScrollProgress/><a className="skip-link" href="#main">Skip to content</a><Header initialTheme={theme}/>{children}<Footer /></body></html>; }

