import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConceptView } from './components/ConceptView';
import { ForgeView } from './components/ForgeView';
import { Icon } from './components/Icon';
import { LaunchView } from './components/LaunchView';
import { createAccessoryGeometry } from './geometry';
import { downloadGlb, downloadObj, downloadPreview, downloadProject } from './exporters';
import { createProject } from './specs';
import { loadWorkspace, MAX_PROJECT_BYTES, parseProject, saveWorkspace } from './storage';
import type { AccessoryParameters, ProjectBrief, SavedProject, ViewName, Workspace } from './types';
import { validateAccessory } from './validation';

function savedToProject(saved: SavedProject): ProjectBrief {
  return {
    id: saved.id,
    name: saved.name,
    collection: saved.collection,
    coreNoun: saved.coreNoun,
    aesthetic: saved.aesthetic,
    audience: saved.audience,
    differentiator: saved.differentiator,
    palette: saved.palette,
    bodyScale: saved.bodyScale,
    parameters: { ...saved.parameters },
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

export default function App() {
  const initial = useMemo(() => loadWorkspace(typeof window === 'undefined' ? undefined : window.localStorage), []);
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace);
  const [view, setView] = useState<ViewName>('forge');
  const [showBounds, setShowBounds] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState(initial.warning ?? '');
  const [storageWarning, setStorageWarning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCanvas = useCallback((canvas: HTMLCanvasElement | null) => { canvasRef.current = canvas; }, []);

  const geometry = useMemo(() => createAccessoryGeometry(workspace.active.parameters), [workspace.active.parameters]);
  const validation = useMemo(() => validateAccessory(geometry, workspace.active.bodyScale), [geometry, workspace.active.bodyScale]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => setStorageWarning(!saveWorkspace(workspace, window.localStorage)), [workspace]);
  useEffect(() => {
    if (toast === '') return undefined;
    const timer = window.setTimeout(() => setToast(''), 4_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setActive = (project: ProjectBrief) => setWorkspace((current) => ({ ...current, active: { ...project, updatedAt: new Date().toISOString() } }));
  const updateActive = (changes: Partial<ProjectBrief>) => setWorkspace((current) => ({
    ...current,
    active: { ...current.active, ...changes, updatedAt: new Date().toISOString() },
  }));
  const updateParameters = (parameters: AccessoryParameters) => updateActive({ parameters });

  const saveProject = () => {
    const now = new Date().toISOString();
    setWorkspace((current) => {
      const saved: SavedProject = { ...current.active, parameters: { ...current.active.parameters }, savedAt: now, updatedAt: now };
      const existing = current.saved.findIndex((project) => project.id === current.active.id);
      const next = existing === -1
        ? [saved, ...current.saved].slice(0, 100)
        : current.saved.map((project) => project.id === current.active.id ? saved : project);
      return { ...current, active: { ...current.active, updatedAt: now }, saved: next };
    });
    setToast('Project saved in this browser.');
  };

  const newProject = () => {
    if (workspace.active.name !== 'Untitled accessory' && !window.confirm('Start a new project? Save the current variation first if you want to keep it.')) return;
    setWorkspace((current) => ({
      ...current,
      active: createProject(),
      launch: {
        original: false,
        cleanMesh: false,
        studioImport: false,
        aftFit: false,
        avatarTests: false,
        marketplaceSettings: false,
        thumbnail: false,
        listing: false,
      },
    }));
    setToast('Fresh project created.');
  };

  const importProject = async (file?: File) => {
    if (file === undefined) return;
    try {
      if (file.size > MAX_PROJECT_BYTES) throw new Error('Project file exceeds the 256 KiB limit.');
      const project = parseProject(await file.text());
      setActive({ ...project, id: createProject().id });
      setToast('Project imported as a new local copy.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Project could not be imported.');
    }
  };

  const exportGlb = async () => {
    try {
      await downloadGlb(geometry, workspace.active);
      setToast('GLB exported. Finish and test it in Blender and Studio.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'GLB export failed.');
    }
  };

  const navItems: Array<{ id: ViewName; label: string; detail: string; icon: 'box' | 'spark' | 'shield' }> = [
    { id: 'forge', label: 'Forge', detail: 'Shape and export', icon: 'box' },
    { id: 'concept', label: 'Concept', detail: 'Brief and prompt', icon: 'spark' },
    { id: 'launch', label: 'Launch', detail: 'Validate and price', icon: 'shield' },
  ];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to workspace</a>
      <header className="app-header">
        <a className="brand" href="#main-content" onClick={() => setView('forge')} aria-label="FormMint forge"><img src="./icon.svg" alt="" /><span><strong>FormMint</strong><small>Accessory workbench</small></span></a>
        <nav className={mobileNav ? 'open' : ''} aria-label="Workspace views">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon name={item.icon} size={18} /><span><strong>{item.label}</strong><small>{item.detail}</small></span></button>)}</nav>
        <div className="header-actions">{storageWarning && <span className="storage-status"><span /> Storage blocked</span>}<button className="header-save" onClick={saveProject}><Icon name="save" size={17} /> <span>Save project</span></button><button className="menu-button" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}><Icon name={mobileNav ? 'x' : 'menu'} /></button></div>
      </header>

      <main id="main-content">
        {view === 'forge' && <ForgeView project={workspace.active} geometry={geometry} validation={validation} showBounds={showBounds} onShowBounds={setShowBounds} onProjectName={(name) => updateActive({ name })} onParameters={updateParameters} onBodyScale={(bodyScale) => updateActive({ bodyScale })} onCanvas={onCanvas} onGlb={() => { void exportGlb(); }} onObj={() => { downloadObj(geometry, workspace.active); setToast('OBJ exported.'); }} onPreview={() => { if (canvasRef.current === null) setToast('3D preview is not ready yet.'); else { downloadPreview(canvasRef.current, workspace.active); setToast('Preview image exported.'); } }} onSave={saveProject} />}
        {view === 'concept' && <ConceptView project={workspace.active} saved={workspace.saved} onChange={setActive} onLoad={(project) => { setActive(savedToProject(project)); setView('forge'); setToast('Saved project opened.'); }} onDelete={(id) => { if (window.confirm('Delete this saved project from the browser?')) setWorkspace((current) => ({ ...current, saved: current.saved.filter((project) => project.id !== id) })); }} onSave={saveProject} onNew={newProject} onExportProject={() => { downloadProject(workspace.active); setToast('Portable project exported.'); }} onImportProject={(file) => { void importProject(file); }} />}
        {view === 'launch' && <LaunchView validation={validation} economics={workspace.economics} checklist={workspace.launch} onEconomics={(economics) => setWorkspace((current) => ({ ...current, economics }))} onChecklist={(launch) => setWorkspace((current) => ({ ...current, launch }))} />}
      </main>
      {toast !== '' && <div className="toast" role="status"><Icon name="check" size={17} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="x" size={15} /></button></div>}
    </div>
  );
}
