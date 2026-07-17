import type { ChangeEvent } from 'react';
import type { BufferGeometry } from 'three';
import { DESIGN_META, HAT_BOUNDS, PRESETS, SPEC_VERIFIED_DATE } from '../specs';
import { DESIGN_KINDS, type AccessoryParameters, type ProjectBrief, type ValidationResult } from '../types';
import { Icon } from './Icon';
import { ModelViewport } from './ModelViewport';

interface ForgeViewProps {
  project: ProjectBrief;
  geometry: BufferGeometry;
  validation: ValidationResult;
  showBounds: boolean;
  onShowBounds: (value: boolean) => void;
  onProjectName: (value: string) => void;
  onParameters: (parameters: AccessoryParameters) => void;
  onBodyScale: (value: ProjectBrief['bodyScale']) => void;
  onCanvas: (canvas: HTMLCanvasElement | null) => void;
  onGlb: () => void;
  onObj: () => void;
  onPreview: () => void;
  onSave: () => void;
}

interface RangeFieldProps {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function RangeField({ label, value, minimum, maximum, step, unit = '', onChange }: RangeFieldProps) {
  return (
    <label className="range-field">
      <span><strong>{label}</strong><output>{value}{unit}</output></span>
      <input type="range" min={minimum} max={maximum} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function ForgeView({ project, geometry, validation, showBounds, onShowBounds, onProjectName, onParameters, onBodyScale, onCanvas, onGlb, onObj, onPreview, onSave }: ForgeViewProps) {
  const update = <K extends keyof AccessoryParameters>(key: K, value: AccessoryParameters[K]) => onParameters({ ...project.parameters, [key]: value });
  const presetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS[Number(event.target.value)];
    if (preset !== undefined) onParameters({ ...preset.parameters });
  };
  const limits = HAT_BOUNDS[project.bodyScale];

  return (
    <div className="forge-view">
      <aside className="control-panel">
        <div className="panel-heading"><div><span className="eyebrow">Procedural starting mesh</span><h2>Shape controls</h2></div><Icon name="sliders" /></div>
        <label className="field"><span>Project name</span><input value={project.name} maxLength={100} onChange={(event) => onProjectName(event.target.value)} /></label>
        <label className="field"><span>Quick preset</span><div className="select-wrap"><select defaultValue="" onChange={presetChange}><option value="" disabled>Choose a starting point</option>{PRESETS.map((preset, index) => <option key={preset.name} value={index}>{preset.name}</option>)}</select><Icon name="chevron" size={15} /></div></label>

        <fieldset className="design-picker"><legend>Silhouette family</legend><div>{DESIGN_KINDS.map((design) => <button type="button" key={design} className={project.parameters.design === design ? 'active' : ''} onClick={() => update('design', design)}><span className={`design-glyph ${design}`} /><strong>{DESIGN_META[design].name}</strong><small>{DESIGN_META[design].description}</small></button>)}</div></fieldset>

        <div className="control-group"><div className="control-label"><span>Proportions</span><small>Studs</small></div>
          <RangeField label="Radius" value={project.parameters.radius} minimum={0.3} maximum={1.4} step={0.01} onChange={(value) => update('radius', value)} />
          <RangeField label="Thickness" value={project.parameters.thickness} minimum={0.025} maximum={0.3} step={0.005} onChange={(value) => update('thickness', value)} />
          <RangeField label={DESIGN_META[project.parameters.design].heightLabel} value={project.parameters.height} minimum={0.08} maximum={1.5} step={0.01} onChange={(value) => update('height', value)} />
          <RangeField label="Vertical offset" value={project.parameters.offsetY} minimum={-0.5} maximum={1.5} step={0.01} onChange={(value) => update('offsetY', value)} />
        </div>

        <div className="control-group"><div className="control-label"><span>Complexity</span><small>Keep it lean</small></div>
          <RangeField label={DESIGN_META[project.parameters.design].countLabel} value={project.parameters.count} minimum={3} maximum={20} step={1} onChange={(value) => update('count', value)} />
          <RangeField label="Surface detail" value={project.parameters.detail} minimum={5} maximum={20} step={1} onChange={(value) => update('detail', value)} />
        </div>

        <div className="control-group"><div className="control-label"><span>Preview material</span><small>Refine later</small></div>
          <label className="color-field"><span>Base color</span><input type="color" value={project.parameters.color} onChange={(event) => update('color', event.target.value)} /><code>{project.parameters.color.toUpperCase()}</code></label>
          <RangeField label="Roughness" value={project.parameters.roughness} minimum={0} maximum={1} step={0.01} onChange={(value) => update('roughness', value)} />
          <RangeField label="Metalness" value={project.parameters.metalness} minimum={0} maximum={1} step={0.01} onChange={(value) => update('metalness', value)} />
        </div>
      </aside>

      <section className="viewport-panel">
        <div className="viewport-toolbar">
          <div><span className={`status-light ${validation.exportReady ? 'ready' : 'blocked'}`} /><strong>{validation.exportReady ? 'Geometry gate passed' : 'Fix failed checks'}</strong></div>
          <label className="switch"><input type="checkbox" checked={showBounds} onChange={(event) => onShowBounds(event.target.checked)} /><span /><em>Show Hat boundary</em></label>
        </div>
        <ModelViewport geometry={geometry} project={project} showBounds={showBounds} onCanvas={onCanvas} />
        <div className="viewport-help"><span>Drag to orbit</span><span>Scroll to zoom</span><span>Right-drag to pan</span></div>
        <div className="viewport-badge"><Icon name="box" size={16} /> One merged export mesh</div>
      </section>

      <aside className="inspector-panel">
        <div className="panel-heading"><div><span className="eyebrow">Live geometry gate</span><h2>Readiness</h2></div><span className={`score-ring ${validation.exportReady ? 'pass' : 'fail'}`}>{validation.checks.filter((check) => check.status === 'pass').length}/{validation.checks.length}</span></div>
        <div className="metric-grid"><div><span>Triangles</span><strong>{validation.metrics.triangles.toLocaleString()}</strong></div><div><span>Vertices</span><strong>{validation.metrics.vertices.toLocaleString()}</strong></div><div><span>Open edges</span><strong>{validation.metrics.boundaryEdges}</strong></div><div><span>Scale</span><strong>{project.bodyScale}</strong></div></div>
        <label className="field"><span>Fit target</span><div className="select-wrap"><select value={project.bodyScale} onChange={(event) => onBodyScale(event.target.value as ProjectBrief['bodyScale'])}><option>Normal</option><option>Classic</option><option>Slender</option></select><Icon name="chevron" size={15} /></div><small>Hat boundary: {limits.width} × {limits.height} × {limits.depth}</small></label>
        <div className="check-list">{validation.checks.map((check) => <div className={`check-row ${check.status}`} key={check.id}><span>{check.status === 'pass' ? <Icon name="check" size={15} /> : <Icon name="info" size={15} />}</span><div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</div>
        <p className="verified-note"><Icon name="shield" size={15} /> Rules checked against official documentation on {SPEC_VERIFIED_DATE}. Studio remains the final validator.</p>
        <div className="export-block"><div className="control-label"><span>Export starting mesh</span><small>Local files</small></div><button className="primary-button" disabled={!validation.exportReady} onClick={onGlb}><Icon name="download" size={17} /> Export GLB</button><div className="split-buttons"><button onClick={onObj}><Icon name="file" size={16} /> OBJ</button><button onClick={onPreview}><Icon name="image" size={16} /> PNG</button></div><button className="save-button" onClick={onSave}><Icon name="save" size={16} /> Save local project</button></div>
      </aside>
    </div>
  );
}
