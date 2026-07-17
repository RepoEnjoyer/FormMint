import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { Mesh, MeshStandardMaterial, type BufferGeometry, type Object3D } from 'three';
import { downloadPreflightReport, downloadPreparedGlb, downloadPreview } from '../exporters';
import { importModelFiles } from '../modelImport';
import {
  analyzeObject,
  createPreviewGeometry,
  disposeObject,
  prepareSafeGeometry,
  type OverlayKind,
  type PreflightAnalysis,
} from '../preflight';
import type { BodyScale, ProjectBrief } from '../types';
import { Icon } from './Icon';
import { PreflightViewport } from './PreflightViewport';

interface PreflightViewProps {
  project: ProjectBrief;
  onToast: (message: string) => void;
}

interface Session {
  source: Object3D;
  name: string;
  bytes: number;
  originalGeometry: BufferGeometry;
  originalAnalysis: PreflightAnalysis;
  preparedGeometry: BufferGeometry | undefined;
  preparedAnalysis: PreflightAnalysis | undefined;
  changes: string[];
}

function analyzeGeometry(geometry: BufferGeometry, bodyScale: BodyScale): PreflightAnalysis {
  const material = new MeshStandardMaterial();
  const mesh = new Mesh(geometry, material);
  const analysis = analyzeObject(mesh, bodyScale);
  material.dispose();
  return analysis;
}

function bytesLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString()} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function disposeSession(session: Session | null): void {
  if (session === null) return;
  disposeObject(session.source);
  session.originalGeometry.dispose();
  session.preparedGeometry?.dispose();
}

export function PreflightView({ project, onToast }: PreflightViewProps) {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [bodyScale, setBodyScale] = useState<BodyScale>(project.bodyScale);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<OverlayKind>('none');
  const [wireframe, setWireframe] = useState(false);
  const [showBounds, setShowBounds] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const onCanvas = useCallback((canvas: HTMLCanvasElement | null) => { canvasRef.current = canvas; }, []);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => () => disposeSession(sessionRef.current), []);

  const load = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      const imported = await importModelFiles(files);
      const originalGeometry = createPreviewGeometry(imported.object);
      const originalAnalysis = analyzeObject(imported.object, bodyScale);
      const next: Session = {
        source: imported.object,
        name: project.name.trim() === '' || project.name === 'Untitled accessory' ? 'Imported accessory' : project.name,
        bytes: imported.bytes,
        originalGeometry,
        originalAnalysis,
        preparedGeometry: undefined,
        preparedAnalysis: undefined,
        changes: [],
      };
      disposeSession(sessionRef.current);
      sessionRef.current = next;
      setSession(next);
      setActiveOverlay(originalAnalysis.report.metrics.boundaryEdges > 0 ? 'boundary' : 'none');
      onToast(`Inspected locally: ${originalAnalysis.report.blockers} blockers and ${originalAnalysis.report.warnings} warnings.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Model import failed.');
    } finally {
      setBusy(false);
      setDragging(false);
    }
  };

  const changeBodyScale = (value: BodyScale) => {
    setBodyScale(value);
    setSession((current) => current === null ? null : {
      ...current,
      originalAnalysis: analyzeObject(current.source, value),
      preparedAnalysis: current.preparedGeometry === undefined ? undefined : analyzeGeometry(current.preparedGeometry, value),
    });
  };

  const prepare = () => {
    if (session === null) return;
    try {
      session.preparedGeometry?.dispose();
      const result = prepareSafeGeometry(session.source, bodyScale);
      const preparedAnalysis = analyzeGeometry(result.geometry, bodyScale);
      setSession({ ...session, preparedGeometry: result.geometry, preparedAnalysis, changes: result.changes });
      setActiveOverlay(preparedAnalysis.report.metrics.boundaryEdges > 0 ? 'boundary' : 'none');
      onToast(`Prepared a reversible copy. ${preparedAnalysis.report.blockers} blockers remain.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'The model could not be prepared safely.');
    }
  };

  const resetPrepared = () => {
    if (session?.preparedGeometry === undefined) return;
    session.preparedGeometry.dispose();
    setSession({ ...session, preparedGeometry: undefined, preparedAnalysis: undefined, changes: [] });
    setActiveOverlay(session.originalAnalysis.report.metrics.boundaryEdges > 0 ? 'boundary' : 'none');
    onToast('Returned to the untouched imported model.');
  };

  const clear = () => {
    disposeSession(sessionRef.current);
    sessionRef.current = null;
    setSession(null);
    setActiveOverlay('none');
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void load(event.dataTransfer.files);
  };

  if (session === null) {
    return (
      <div className="preflight-empty">
        <section className="preflight-hero">
          <span className="preflight-kicker"><span /> Private, local model inspection</span>
          <h1>Find expensive mesh problems <em>before</em> Studio does.</h1>
          <p>Drop in a rigid accessory candidate. FormMint inspects the real file, visualizes geometry failures, and creates a reversible prepared copy without uploading anything.</p>
          <div
            className={`model-dropzone ${dragging ? 'dragging' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
          >
            <span className="drop-icon"><Icon name="upload" size={26} /></span>
            <div><strong>{busy ? 'Inspecting model…' : 'Drop a GLB, GLTF, or OBJ'}</strong><small>Up to 64 MiB · related local textures supported · nothing leaves this browser</small></div>
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Working…' : 'Choose files'}</button>
            <input ref={fileRef} type="file" hidden multiple accept=".glb,.gltf,.obj,image/png,image/jpeg,image/webp" onChange={(event) => { if (event.target.files !== null) void load(event.target.files); event.target.value = ''; }} />
          </div>
          <div className="preflight-promise-grid">
            <article><Icon name="shield" /><div><strong>Actionable checks</strong><p>Bounds, topology, UVs, skinning, textures, components, and more.</p></div></article>
            <article><Icon name="sliders" /><div><strong>Visible failures</strong><p>Problem edges and collapsed faces appear directly in the viewport.</p></div></article>
            <article><Icon name="spark" /><div><strong>Safe preparation</strong><p>Work on a generated copy while the imported source remains untouched.</p></div></article>
          </div>
        </section>
      </div>
    );
  }

  const prepared = session.preparedGeometry !== undefined && session.preparedAnalysis !== undefined;
  const geometry = prepared ? session.preparedGeometry! : session.originalGeometry;
  const analysis = prepared ? session.preparedAnalysis! : session.originalAnalysis;
  const report = analysis.report;

  return (
    <div className="preflight-workspace">
      <aside className="preflight-summary">
        <div className="preflight-panel-heading"><span className="eyebrow">Imported locally</span><h1>{session.name}</h1><p>{bytesLabel(session.bytes)} · {prepared ? 'prepared copy' : 'untouched source'}</p></div>
        <div className={`gate-card ${report.browserGatePassed ? 'passed' : 'blocked'}`}><span><Icon name={report.browserGatePassed ? 'check' : 'info'} /></span><div><strong>{report.browserGatePassed ? 'Browser gate passed' : `${report.blockers} blocking ${report.blockers === 1 ? 'issue' : 'issues'}`}</strong><p>{report.warnings} additional {report.warnings === 1 ? 'warning' : 'warnings'} · Studio is still final</p></div></div>
        <div className="preflight-metrics">
          <div><span>Triangles</span><strong>{report.metrics.triangles.toLocaleString()}</strong><small>of 4,000</small></div>
          <div><span>Meshes</span><strong>{report.metrics.meshes}</strong><small>render objects</small></div>
          <div><span>Open edges</span><strong>{report.metrics.boundaryEdges}</strong><small>{report.metrics.nonManifoldEdges} non-manifold</small></div>
          <div><span>Components</span><strong>{report.metrics.components}</strong><small>connected shells</small></div>
        </div>
        <label className="preflight-field"><span>Hat planning boundary</span><select value={bodyScale} onChange={(event) => changeBodyScale(event.target.value as BodyScale)}><option>Normal</option><option>Classic</option><option>Slender</option></select></label>
        <div className="repair-card"><div className="repair-card-title"><Icon name="spark" /><div><strong>Prepare a safe copy</strong><p>Merge objects, remove zero-area faces, strip rigid-incompatible attributes, rebuild normals, recenter, and scale down when required.</p></div></div>{prepared ? <><ul>{session.changes.map((change) => <li key={change}>{change}</li>)}</ul><button className="secondary-button full" onClick={resetPrepared}><Icon name="refresh" size={16} /> Restore source view</button></> : <button className="primary-button full" onClick={prepare}><Icon name="spark" size={17} /> Prepare reversible copy</button>}</div>
        <p className="local-note"><Icon name="shield" size={16} /> Source filenames, paths, identity, and device information are excluded from exported reports.</p>
      </aside>

      <section className="preflight-stage">
        <div className="stage-toolbar"><div><span className={`status-light ${report.browserGatePassed ? 'ready' : 'blocked'}`} /><strong>{prepared ? 'Prepared copy' : 'Source inspection'}</strong><small>{report.metrics.width.toFixed(2)} × {report.metrics.height.toFixed(2)} × {report.metrics.depth.toFixed(2)} studs</small></div><div className="stage-tools"><label><input type="checkbox" checked={showBounds} onChange={(event) => setShowBounds(event.target.checked)} /> Boundary</label><label><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /> Wireframe</label></div></div>
        <PreflightViewport geometry={geometry} overlay={analysis.overlay} activeOverlay={activeOverlay} bodyScale={bodyScale} showBounds={showBounds} wireframe={wireframe} onCanvas={onCanvas} />
        <div className="stage-footer"><span>Drag to orbit</span><span>Scroll to zoom</span><span>Red lines mark selected topology findings</span></div>
      </section>

      <aside className="preflight-findings">
        <div className="findings-header"><div><span className="eyebrow">Preflight report</span><h2>What needs attention</h2></div><button aria-label="Close imported model" onClick={clear}><Icon name="x" size={18} /></button></div>
        <div className="finding-filters"><span>{report.blockers} blockers</span><span>{report.warnings} warnings</span><span>{report.findings.length - report.blockers - report.warnings} passed</span></div>
        <div className="finding-list">{report.findings.map((item) => <button key={item.id} className={`finding-row ${item.severity} ${item.overlay !== 'none' && activeOverlay === item.overlay ? 'active' : ''}`} onClick={() => setActiveOverlay(item.overlay === 'none' ? 'none' : activeOverlay === item.overlay ? 'none' : item.overlay)}><span className="finding-state"><Icon name={item.severity === 'pass' ? 'check' : 'info'} size={15} /></span><span><strong>{item.title}</strong><small>{item.detail}</small><em>{item.action}</em></span>{item.overlay !== 'none' && <b>{activeOverlay === item.overlay ? 'Hide' : 'Show'}</b>}</button>)}</div>
        <div className="preflight-actions"><button className="primary-button" disabled={!prepared} onClick={() => { if (session.preparedGeometry !== undefined) void downloadPreparedGlb(session.preparedGeometry, project.name || 'FormMint accessory').then(() => onToast('Prepared GLB exported. Finish and validate it in Blender and Studio.')).catch((error: unknown) => onToast(error instanceof Error ? error.message : 'GLB export failed.')); }}><Icon name="download" size={17} /> Export prepared GLB</button><div><button className="secondary-button" onClick={() => { downloadPreflightReport(report, project.name || 'FormMint accessory'); onToast('Privacy-safe preflight report exported.'); }}><Icon name="file" size={16} /> Report</button><button className="secondary-button" onClick={() => { if (canvasRef.current !== null) { downloadPreview(canvasRef.current, project); onToast('Inspection preview exported.'); } }}><Icon name="image" size={16} /> PNG</button></div></div>
      </aside>
    </div>
  );
}
