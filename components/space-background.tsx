import './space-background.css';

/** Place inside a positioned hero; decoration never occupies document flow. */
export function SpaceBackground(){return <div className="space-background" aria-hidden="true"><div className="sb-stars"/><div className="sb-planet"/><div className="sb-bokeh"><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/></div><div className="sb-sheets"><div className="sb-sheet"/><div className="sb-sheet"/><div className="sb-sheet"/></div></div>;}
