import {SessionRefresh} from './session-refresh';
import Image from 'next/image';
import Link from '@/components/native-link';
import { ThemeToggle } from './theme-toggle';
import { getCurrentUser } from '@/lib/auth';
import {LogoutButton} from './logout-button';
import {MobileMenu} from './mobile-menu';

const links = [ ['Home','/'], ['Research Papers','/research-papers'], ['Browse by Year','/browse-by-year'], ['Programs','/programs'], ['About','/about'], ['FAQ','/faq'] ];
export async function Header({initialTheme='light'}:{initialTheme?:'light'|'dark'}) { let user:Awaited<ReturnType<typeof getCurrentUser>>=null;try{user=await getCurrentUser();}catch(e){console.error('Header session check failed',e);} return <header className="site-header"><SessionRefresh identity={user?user.id+':'+user.role:''}/><div className="wrap header-inner">
  <Link className="brand" href="/" aria-label="KUTA home"><span className="brand-mark"><Image src="/assets/slsu-gumaca-logo.webp" alt="SLSU Gumaca campus logo" width={44} height={44} preload /></span><span className="brand-text"><strong>KUTA</strong><small>SLSU Gumaca Research Archive</small></span></Link>
  <nav className="desktop-nav" aria-label="Primary navigation">{links.map(([label,url])=><Link href={url} key={url}>{label}</Link>)}</nav>
  <div className="header-actions"><Link className="header-search" href="/research-papers">Search archive</Link>{user?.role==='public'&&<Link className="account-link" href="/profile">Favorites</Link>}{user?.role==='admin'&&<Link className="account-link" href="/admin">Dashboard</Link>}{user&&<span className="account-name">{user.picture&&<img src={user.picture} alt="" width={28} height={28} className="account-avatar" referrerPolicy="no-referrer"/>}{user.name||user.email}</span>}{user?<LogoutButton/>:<Link className="account-link" href="/login">Sign in with Google</Link>}</div>
  <div className="header-theme"><ThemeToggle initialTheme={initialTheme}/></div>
  <MobileMenu><nav aria-label="Mobile navigation">{links.map(([label,url])=><Link href={url} key={url}>{label}</Link>)}</nav><div className="mobile-account"><Link className="button button-primary" href="/research-papers">Search archive</Link>{user?.role==='public'&&<Link className="account-link" href="/profile">Favorites</Link>}{user?.role==='admin'&&<Link className="account-link" href="/admin">Dashboard</Link>}{user&&<p className="mobile-account-name">{user.picture&&<img src={user.picture} alt="" width={28} height={28} className="account-avatar" referrerPolicy="no-referrer"/>}{user.name||user.email}</p>}{user?<LogoutButton/>:<Link className="account-link" href="/login">Sign in with Google</Link>}</div></MobileMenu>
</div></header>; }
export function Footer() { return <footer className="footer"><div className="wrap footer-grid"><div><div className="footer-brand">SLSU <span>GUMACA</span></div><p>Research Paper Compiler & Digital Archive</p><p className="fine">A student research project for organizing SLSU Gumaca Campus research. Institutional approval and archive records are pending.</p></div><div><h2>Explore</h2><nav aria-label="Footer navigation">{links.slice(1).map(([label,url])=><Link href={url} key={url}>{label}</Link>)}</nav></div><div><h2>Project researchers</h2><p>Alfred James Reth Lutching Dionco<br/>Prince Laurel<br/>Kurt John Lenoel Loling</p></div></div><div className="wrap footer-bottom">Southern Luzon State University – Gumaca Campus · Research archive project</div></footer>; }



