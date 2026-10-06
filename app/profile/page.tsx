import {redirect} from 'next/navigation';
import {getCurrentUser} from '@/lib/auth';
import {FavoritesPanel} from '@/components/favorites-panel';
export const dynamic='force-dynamic';
export default async function Profile(){
 const user=await getCurrentUser();if(!user)redirect('/login?return_to=%2Fprofile');if(user.role==='admin')redirect('/admin');
 return <main id="main" className="page-main wrap"><div className="page-intro"><p className="eyebrow">YOUR ARCHIVE</p><h1>Your profile</h1><p>{user.name||user.email}</p></div><FavoritesPanel/></main>;
}
