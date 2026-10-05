import {archiveYears} from '@/lib/year-summary';
import {json} from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){
 try{return json({years:await archiveYears()});}
 catch{console.error('Year counts query failed');return json({years:[]},503);}
}
