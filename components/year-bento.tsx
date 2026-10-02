import Link from './native-link';
import {YearMotion} from './year-motion';
import {archiveYears} from '@/lib/year-summary';
import {departmentAccentFor} from '@/lib/departments';
import type {CSSProperties} from 'react';
import type {YearSummary} from '@/lib/year-data';

const href=(year:number)=>`/research-papers?year=${year}`;
const label=(y:YearSummary)=>`${y.year}, ${y.count} verified ${y.count===1?'paper':'papers'}`;
const delay=(index:number)=>({'--year-delay':`${Math.min(index%4,3)*65}ms`} as CSSProperties);
function Count({year}:{year:YearSummary}){return <span className="year-count" aria-hidden="true"><strong data-year-count={year.count} style={{minWidth:`${Math.max(1,String(year.count).length)}ch`}}>{year.count}</strong> verified {year.count===1?'paper':'papers'}</span>;}

export function YearBentoSkeleton(){return <div className="year-bento year-skeleton" role="status" aria-label="Loading archive years"><div className="year-featured"/><div className="year-medium"/><div className="year-medium"/><div className="year-timeline"/>{Array.from({length:15},(_,i)=><div className="year-small" key={i}/>)}</div>;}

export async function YearBento(){
 let years:YearSummary[];
 try{years=await archiveYears();}catch(error){console.error('Archive years unavailable',error);return <div className="state-card" role="status"><p>Year counts are temporarily unavailable.</p><Link className="button button-outline" href="/research-papers">Open the archive</Link></div>;}
 const total=years.reduce((sum,y)=>sum+y.count,0),featured=years[0],max=Math.max(1,...years.map(y=>y.count));
 return <>{total===0&&<p className="year-empty" role="status">No verified papers have been archived yet. Explore any year below; new records will appear after verification.</p>}<YearMotion>
  {years.slice(0,3).map((year,index)=><li key={year.year} className={`year-item ${index===0?'year-featured':'year-medium'}`} style={delay(index)}><Link className={`year-tile ${year.count===0?'year-zero':''}`} href={href(year.year)} aria-label={label(year)}><span className="eyebrow">{index===0?'THE LATEST CHAPTER':'RECENT YEAR'}</span><strong className="year-number" aria-hidden="true">{year.year}</strong><Count year={year}/><span className="year-prompt" aria-hidden="true">{year.count?'View papers':'No verified papers yet'} <span>↗</span></span>{index===0&&<div className="year-share"><p>Verified papers by program</p>{featured.count>0?<><div className="year-segments" aria-hidden="true">{featured.departments.filter(d=>d.count>0).map(d=><span key={d.slug} className={departmentAccentFor(d.slug).className} style={{flexGrow:d.count}}/>)}</div><ul className="year-legend" aria-label={`${featured.year} program counts`}>{featured.departments.filter(d=>d.count>0).map(d=><li key={d.slug}><span className={`year-dot ${departmentAccentFor(d.slug).className}`} aria-hidden="true"/><span>{d.name}</span><strong>{d.count}</strong></li>)}</ul></>:<span className="year-share-empty">Program shares will appear when papers are verified.</span>}</div>}</Link></li>)}
  <li className="year-item year-timeline" style={delay(3)}><div className="year-timeline-inner"><div><h3>Archive timeline</h3><p>Each bar opens that year. Only verified papers count.</p></div><ul className="year-chart" aria-label="Verified papers per year">{[...years].reverse().map(year=><li key={year.year}><Link href={href(year.year)} aria-label={label(year)} className={year.count===0?'year-bar-zero':''}><span className="year-bar-track" aria-hidden="true"><span className="year-bar" style={{height:year.count?`${Math.max(7,year.count/max*100)}%`:'4px'}}/></span><span className="year-bar-label" aria-hidden="true">{String(year.year).slice(-2)}</span></Link></li>)}</ul><div className="year-chart-range" aria-hidden="true"><span>2009</span><span>2026</span></div><table className="sr-only"><caption>Verified papers by year, 2009 to 2026</caption><thead><tr><th scope="col">Year</th><th scope="col">Verified papers</th></tr></thead><tbody>{[...years].reverse().map(y=><tr key={y.year}><th scope="row">{y.year}</th><td>{y.count}</td></tr>)}</tbody></table></div></li>
  {years.slice(3).map((year,index)=><li key={year.year} className="year-item year-small" style={delay(index)}><Link className={`year-tile ${year.count===0?'year-zero':''}`} href={href(year.year)} aria-label={label(year)}><strong className="year-number" aria-hidden="true">{year.year}</strong><Count year={year}/><span className="year-prompt" aria-hidden="true">{year.count?'View papers':'No verified papers yet'} <span>↗</span></span></Link></li>)}
  <li className="year-item year-all"><Link className="year-tile" href="/research-papers"><strong>All years</strong><span>Explore the full research list</span><span aria-hidden="true">↗</span></Link></li>
 </YearMotion></>;
}
