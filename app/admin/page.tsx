import Link from '@/components/native-link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminConsole } from '@/components/admin-console';
export const dynamic='force-dynamic';
export default async function Admin(){
  const user=await getCurrentUser();
  if(!user)redirect('/login?return_to=%2Fadmin');
  if(user.role!=='admin')return <main id="main" className="page-main wrap"><div className="state-card"><h1>Administrator access required</h1><p>Your account can browse the archive but cannot change records.</p><Link className="button button-outline" href="/research-papers">Browse research</Link></div></main>;
  return <main id="main" className="page-main"><div className="wrap"><div className="page-intro"><p className="eyebrow">ARCHIVE MANAGEMENT</p><h1>Research dashboard</h1><p>Add records, verify metadata, and attach PDF files. Pending records are not public.</p></div><AdminConsole/></div></main>;
}
