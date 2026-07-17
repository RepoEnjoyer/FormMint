import { FEES_URL, IMPORT_GUIDE_URL, MARKETPLACE_POLICY_URL, OFFICIAL_SPEC_URL, SPEC_VERIFIED_DATE } from '../specs';
import type { LaunchChecklist, ValidationResult } from '../types';
import { Icon } from './Icon';

interface LaunchViewProps {
  validation: ValidationResult;
  checklist: LaunchChecklist;
  onChecklist: (value: LaunchChecklist) => void;
}

const launchSteps: Array<{ key: keyof LaunchChecklist; title: string; detail: string }> = [
  { key: 'original', title: 'Originality checked', detail: 'Marketplace search completed; no copied brands, characters, logos, or close item matches.' },
  { key: 'cleanMesh', title: 'Mesh cleaned in Blender', detail: 'One mesh, closed geometry, applied transforms, useful UVs, and no hidden leftovers.' },
  { key: 'studioImport', title: 'Imported into Studio', detail: 'GLB or OBJ passed the 3D Importer without warnings that affect the item.' },
  { key: 'aftFit', title: 'Accessory Fitting Tool passed', detail: 'Correct Hat category, attachment, scale, rotation, and boundary.' },
  { key: 'avatarTests', title: 'Tested on multiple bodies', detail: 'Fit, clipping, animations, and visibility checked on several avatar shapes.' },
  { key: 'marketplaceSettings', title: 'Marketplace settings checked', detail: 'Material Plastic, Transparency 0, default VertexColor, and no scripts or extra parts.' },
  { key: 'thumbnail', title: 'Thumbnail prepared', detail: 'Full silhouette is readable at small size on a contrasting, honest background.' },
  { key: 'listing', title: 'Listing proofread', detail: 'Accurate category, natural title, no keyword spam, and no misleading claims.' },
];

export function LaunchView({ validation, checklist, onChecklist }: LaunchViewProps) {
  const complete = Object.values(checklist).filter(Boolean).length;
  return (
    <div className="page-view launch-view">
      <header className="page-header"><div><span className="eyebrow">Studio remains the authority</span><h1>Finish checklist</h1><p>Complete the work a browser cannot prove, run Studio’s current validation, and inspect the final item carefully before paying an upload fee.</p></div><div className={`launch-score ${complete === launchSteps.length ? 'complete' : ''}`}><strong>{complete}/{launchSteps.length}</strong><span>steps complete</span></div></header>
      <div className="launch-grid">
        <section className="surface-card launch-checks"><div className="section-title"><span>01</span><div><h2>Production checklist</h2><p>The upload fee is usually not refunded after rejection.</p></div></div><div className="launch-step-list">{launchSteps.map((step, index) => <label className={checklist[step.key] ? 'done' : ''} key={step.key}><input type="checkbox" checked={checklist[step.key]} onChange={() => onChecklist({ ...checklist, [step.key]: !checklist[step.key] })} /><span className="step-check"><Icon name="check" size={15} /></span><em>{String(index + 1).padStart(2, '0')}</em><div><strong>{step.title}</strong><p>{step.detail}</p></div></label>)}</div></section>

        <div className="launch-side">
          <section className="surface-card geometry-summary"><div className="section-title"><span>02</span><div><h2>Current geometry</h2><p>Automated checks from the Forge.</p></div></div><div className={`geometry-verdict ${validation.exportReady ? 'pass' : 'fail'}`}><Icon name={validation.exportReady ? 'shield' : 'info'} /><div><strong>{validation.exportReady ? 'Browser geometry gate passed' : 'Geometry needs changes'}</strong><p>{validation.metrics.triangles.toLocaleString()} triangles, {validation.metrics.boundaryEdges} suspect edges.</p></div></div>{validation.checks.filter((check) => check.status !== 'pass').map((check) => <div className="remaining-check" key={check.id}><span className={check.status} /> <div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</section>

          <section className="surface-card handoff-card"><div className="section-title"><span>03</span><div><h2>Studio handoff</h2><p>Use official tools on the final exported candidate.</p></div></div><ol className="handoff-list"><li><strong>Import the prepared candidate</strong><span>Use Studio’s current 3D Importer and resolve every relevant warning.</span></li><li><strong>Convert with the Accessory Fitting Tool</strong><span>Select the correct accessory category, position it, and test multiple avatar bodies.</span></li><li><strong>Run current UGC validation</strong><span>Use Roblox’s visualization checks to locate remaining errors and quality warnings.</span></li><li><strong>Review the irreversible upload</strong><span>Assets and thumbnails cannot simply be replaced after upload; verify the final files first.</span></li></ol></section>
        </div>
      </div>

      <section className="official-links"><div><Icon name="shield" /><div><strong>Official sources, checked {SPEC_VERIFIED_DATE}</strong><p>Rules and fees can change. These links are the authority, not FormMint.</p></div></div><nav><a href={OFFICIAL_SPEC_URL} target="_blank" rel="noreferrer">Rigid specs <Icon name="external" size={14} /></a><a href={IMPORT_GUIDE_URL} target="_blank" rel="noreferrer">Studio import <Icon name="external" size={14} /></a><a href={MARKETPLACE_POLICY_URL} target="_blank" rel="noreferrer">Marketplace policy <Icon name="external" size={14} /></a><a href={FEES_URL} target="_blank" rel="noreferrer">Fees <Icon name="external" size={14} /></a></nav></section>
    </div>
  );
}
