import { estimateEconomics } from '../content';
import { FEES_URL, IMPORT_GUIDE_URL, MARKETPLACE_POLICY_URL, OFFICIAL_SPEC_URL, SPEC_VERIFIED_DATE } from '../specs';
import type { EconomicsInputs, LaunchChecklist, ValidationResult } from '../types';
import { Icon } from './Icon';

interface LaunchViewProps {
  validation: ValidationResult;
  economics: EconomicsInputs;
  checklist: LaunchChecklist;
  onEconomics: (value: EconomicsInputs) => void;
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

function NumberField({ label, value, suffix = '', onChange }: { label: string; value: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="number-field"><span>{label}</span><div><input type="number" min="0" max="1000000" step="1" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} />{suffix !== '' && <em>{suffix}</em>}</div></label>;
}

export function LaunchView({ validation, economics, checklist, onEconomics, onChecklist }: LaunchViewProps) {
  const estimate = estimateEconomics(economics);
  const complete = Object.values(checklist).filter(Boolean).length;
  return (
    <div className="page-view launch-view">
      <header className="page-header"><div><span className="eyebrow">Validate before spending</span><h1>Launch desk</h1><p>Finish the parts a browser cannot verify, then understand the upfront Robux before submitting.</p></div><div className={`launch-score ${complete === launchSteps.length ? 'complete' : ''}`}><strong>{complete}/{launchSteps.length}</strong><span>steps complete</span></div></header>
      <div className="launch-grid">
        <section className="surface-card launch-checks"><div className="section-title"><span>01</span><div><h2>Production checklist</h2><p>The upload fee is usually not refunded after rejection.</p></div></div><div className="launch-step-list">{launchSteps.map((step, index) => <label className={checklist[step.key] ? 'done' : ''} key={step.key}><input type="checkbox" checked={checklist[step.key]} onChange={() => onChecklist({ ...checklist, [step.key]: !checklist[step.key] })} /><span className="step-check"><Icon name="check" size={15} /></span><em>{String(index + 1).padStart(2, '0')}</em><div><strong>{step.title}</strong><p>{step.detail}</p></div></label>)}</div></section>

        <div className="launch-side">
          <section className="surface-card geometry-summary"><div className="section-title"><span>02</span><div><h2>Current geometry</h2><p>Automated checks from the Forge.</p></div></div><div className={`geometry-verdict ${validation.exportReady ? 'pass' : 'fail'}`}><Icon name={validation.exportReady ? 'shield' : 'info'} /><div><strong>{validation.exportReady ? 'Browser geometry gate passed' : 'Geometry needs changes'}</strong><p>{validation.metrics.triangles.toLocaleString()} triangles, {validation.metrics.boundaryEdges} suspect edges.</p></div></div>{validation.checks.filter((check) => check.status !== 'pass').map((check) => <div className="remaining-check" key={check.id}><span className={check.status} /> <div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</section>

          <section className="surface-card economics-card"><div className="section-title"><span>03</span><div><h2>Robux checkpoint</h2><p>Editable estimate, never a profit promise.</p></div></div><div className="economics-inputs"><NumberField label="Upload fee" value={economics.uploadFee} suffix="R$" onChange={(value) => onEconomics({ ...economics, uploadFee: value })} /><NumberField label="Publishing advance" value={economics.publishingAdvance} suffix="R$" onChange={(value) => onEconomics({ ...economics, publishingAdvance: value })} /><NumberField label="Planned price" value={economics.salePrice} suffix="R$" onChange={(value) => onEconomics({ ...economics, salePrice: value })} /><NumberField label="Creator share" value={economics.creatorRate} suffix="%" onChange={(value) => onEconomics({ ...economics, creatorRate: Math.min(100, value) })} /><NumberField label="Advance rebate rate" value={economics.rebateRate} suffix="%" onChange={(value) => onEconomics({ ...economics, rebateRate: Math.min(100, value) })} /></div><div className="economics-results"><div><span>Upfront</span><strong>{estimate.upfront.toLocaleString()} R$</strong></div><div><span>Creator share per sale</span><strong>{estimate.creatorPerSale.toFixed(1)} R$</strong></div><div className="featured"><span>Estimated sales to recover upfront</span><strong>{estimate.salesToRecover.toLocaleString()}</strong></div></div><p className="calculator-note">This assumes the entered creator share plus advance rebate rate until the advance is repaid. It excludes taxes, escrow timing, price-floor changes, moderation risk, and demand. Verify current numbers before publishing.</p></section>
        </div>
      </div>

      <section className="official-links"><div><Icon name="shield" /><div><strong>Official sources, checked {SPEC_VERIFIED_DATE}</strong><p>Rules and fees can change. These links are the authority, not FormMint.</p></div></div><nav><a href={OFFICIAL_SPEC_URL} target="_blank" rel="noreferrer">Rigid specs <Icon name="external" size={14} /></a><a href={IMPORT_GUIDE_URL} target="_blank" rel="noreferrer">Studio import <Icon name="external" size={14} /></a><a href={MARKETPLACE_POLICY_URL} target="_blank" rel="noreferrer">Marketplace policy <Icon name="external" size={14} /></a><a href={FEES_URL} target="_blank" rel="noreferrer">Fees <Icon name="external" size={14} /></a></nav></section>
    </div>
  );
}
