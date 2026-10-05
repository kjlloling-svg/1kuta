import Link from './native-link';
import {archiveYears} from '@/lib/year-summary';
import type {CSSProperties} from 'react';
import type {YearSummary} from '@/lib/year-data';
export async function YearBento(){
 let years:YearSummary[];
 try{years=await archiveYears();}catch{console.error('Year counts query failed');return <p className="year-empty" role="status">Year data could not be loaded. Please refresh to try again.</p>;}
 const max=Math.max(0,...years.map(y=>y.count));
 return <ul className="year-bento">{years.map((year,index)=>{
  // Populated years grow with their count; ties get equal space. Preserve chronological order.
  const size=year.count>0&&year.count===max?'year-featured':year.count>0?'year-medium':'year-small';
  return <li key={year.year} className={'year-item '+size} style={{'--year-delay':Math.min(index,7)*40+'ms'} as CSSProperties}><Link className={'year-tile '+(year.count===0?'year-zero':'')} href={'/research-papers?year='+year.year} aria-label={year.year+', '+year.count+' verified '+(year.count===1?'paper':'papers')}><strong className="year-number" aria-hidden="true">{year.year}</strong><span className="year-count" aria-hidden="true">{year.count} verified {year.count===1?'paper':'papers'}</span><span className="year-relative" aria-hidden="true"><span style={{width:(max?year.count/max*100:0)+'%'}}/></span><span className="year-prompt" aria-hidden="true">{year.count?'View papers':'No verified papers yet'} <span>↗</span></span></Link></li>;
 })}</ul>;
}
