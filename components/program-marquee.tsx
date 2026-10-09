import { programs } from '@/lib/programs';
import { departmentAccentFor } from '@/lib/departments';
import Link from './native-link';

export function ProgramMarquee() {
  return <section className="program-marquee" aria-label="Academic programs">
    <div className="marquee-window">
      <div className="marquee-track">
        {[false, true].map(duplicate => <ul key={String(duplicate)} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
          {programs.map(program => {
            const diploma = program.slug === 'dit-computer-technology' ? 'cpt' : program.slug === 'dit-mechanical-technology' ? 'mech' : null;
            return <li key={program.slug} className={`${departmentAccentFor(program.slug).className}${diploma ? ` marquee-diploma-${diploma}` : ''}`}>
              <Link href={`/research-papers?program=${program.slug}`} tabIndex={duplicate ? -1 : undefined} aria-label={diploma ? `${program.name}, major in ${program.major}` : undefined}>
                {diploma === 'cpt' ? 'DIT CPT' : diploma === 'mech' ? 'DIT MECH TECH' : program.label}
              </Link>
              <span aria-hidden="true">✦</span>
            </li>;
          })}
        </ul>)}
      </div>
    </div>
  </section>;
}
