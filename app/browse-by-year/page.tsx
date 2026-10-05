import type {Metadata} from 'next';
import {YearBento} from '@/components/year-bento';
export const metadata:Metadata={title:'Browse Research Papers by Year'};
export const dynamic='force-dynamic';
export default function BrowseByYear(){return <main id="main" className="page-main"><div className="wrap"><div className="page-intro"><h1>Browse Research Papers by Year</h1></div><YearBento/></div></main>;}
