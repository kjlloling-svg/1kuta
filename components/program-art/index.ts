import BusinessArt from './bsba-hrdm';
import NursingArt from './bs-nursing-midwifery';
import ComputingArt from './bsit-computer-technology';
import SocialArt from './bsed-social-studies';
import MathsArt from './bsed-mathematics';
import HardwareArt from './dit-computer-technology';
import MechanicalArt from './dit-mechanical-technology';
import AcademicArt from './fallback';
const identities={
 'bsba-hrdm':{Art:BusinessArt,code:'BSBA',discipline:'Human Resource Development Management',learn:'People, workplaces, and organizations.'},
 'bs-nursing-midwifery':{Art:NursingArt,code:'BSN / DM',discipline:'Nursing & Midwifery',learn:'Patient care across every life stage.'},
 'bsit-computer-technology':{Art:ComputingArt,code:'BSIT',discipline:'Computer Technology',learn:'Code, circuits, and connected systems.'},
 'bsed-social-studies':{Art:SocialArt,code:'BSEd',discipline:'Social Studies',learn:'History, geography, and civic life.'},
 'bsed-mathematics':{Art:MathsArt,code:'BSEd',discipline:'Mathematics',learn:'Patterns, proofs, and problem-solving.'},
 'dit-computer-technology':{Art:HardwareArt,code:'DIT',discipline:'Computer Technology',learn:'Computer hardware and practical systems.'},
 'dit-mechanical-technology':{Art:MechanicalArt,code:'DIT',discipline:'Mechanical Technology',learn:'Machines, mechanisms, and workshop skills.'},
};
export function programIdentity(slug:string){return Object.hasOwn(identities,slug)?identities[slug as keyof typeof identities]:{Art:AcademicArt,code:'Program',discipline:'Academic program',learn:'Explore this program’s research.'};}
