import { useState } from 'react';
import { buildListingDraft, buildReferencePrompt } from '../content';
import type { ProjectBrief, SavedProject } from '../types';
import { Icon } from './Icon';

interface ConceptViewProps {
  project: ProjectBrief;
  saved: SavedProject[];
  onChange: (project: ProjectBrief) => void;
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onNew: () => void;
  onExportProject: () => void;
  onImportProject: (file?: File) => void;
}

export function ConceptView({ project, saved, onChange, onLoad, onDelete, onSave, onNew, onExportProject, onImportProject }: ConceptViewProps) {
  const [copied, setCopied] = useState('');
  const prompt = buildReferencePrompt(project);
  const listing = buildListingDraft(project);
  const update = <K extends keyof ProjectBrief>(key: K, value: ProjectBrief[K]) => onChange({ ...project, [key]: value });
  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1_800);
  };

  return (
    <div className="page-view concept-view">
      <header className="page-header"><div><span className="eyebrow">Originality before geometry</span><h1>Concept lab</h1><p>Build a precise design brief, then use it as your reference-sheet prompt and listing foundation.</p></div><div><button className="secondary-button" onClick={onNew}><Icon name="plus" size={17} /> New</button><button className="primary-button" onClick={onSave}><Icon name="save" size={17} /> Save project</button></div></header>
      <div className="concept-grid">
        <section className="surface-card brief-card"><div className="section-title"><span>01</span><div><h2>Design brief</h2><p>Specific inputs create more coherent references.</p></div></div>
          <div className="form-grid two"><label className="field"><span>Project name</span><input value={project.name} maxLength={100} onChange={(event) => update('name', event.target.value)} /></label><label className="field"><span>Collection</span><input value={project.collection} maxLength={100} onChange={(event) => update('collection', event.target.value)} placeholder="Signal Series" /></label></div>
          <div className="form-grid two"><label className="field"><span>Core item</span><input value={project.coreNoun} maxLength={80} onChange={(event) => update('coreNoun', event.target.value)} placeholder="crown, halo, horns" /></label><label className="field"><span>Palette</span><input value={project.palette} maxLength={120} onChange={(event) => update('palette', event.target.value)} placeholder="charcoal and electric lime" /></label></div>
          <label className="field"><span>Aesthetic direction</span><input value={project.aesthetic} maxLength={160} onChange={(event) => update('aesthetic', event.target.value)} placeholder="clean futuristic streetwear" /></label>
          <label className="field"><span>Who would wear it?</span><textarea value={project.audience} maxLength={240} rows={3} onChange={(event) => update('audience', event.target.value)} /></label>
          <label className="field"><span>Why is it different?</span><textarea value={project.differentiator} maxLength={300} rows={4} onChange={(event) => update('differentiator', event.target.value)} /></label>
          <div className="originality-callout"><Icon name="shield" /><div><strong>Originality gate</strong><p>Search the Marketplace before modelling. Change the silhouette, construction, and detail language if an existing item feels too close. Never use brands, characters, logos, or another creator's mesh.</p></div></div>
        </section>

        <div className="concept-results">
          <section className="surface-card prompt-card"><div className="section-title"><span>02</span><div><h2>Reference-sheet prompt</h2><p>Works with the image generator you already use.</p></div></div><div className="generated-copy"><p>{prompt}</p><button onClick={() => { void copy('prompt', prompt); }}><Icon name={copied === 'prompt' ? 'check' : 'copy'} size={16} /> {copied === 'prompt' ? 'Copied' : 'Copy prompt'}</button></div><small>Reference art is a guide, not a finished upload. Confirm the generator permits commercial use and rebuild the design as your own clean mesh.</small></section>
          <section className="surface-card listing-card"><div className="section-title"><span>03</span><div><h2>Listing starter</h2><p>Clear language without keyword spam.</p></div></div><div className="title-options">{listing.titles.map((title) => <button key={title} onClick={() => { void copy(title, title); }}><span>{title}</span><Icon name={copied === title ? 'check' : 'copy'} size={15} /></button>)}</div><div className="description-draft"><p>{listing.description}</p><button onClick={() => { void copy('description', listing.description); }}><Icon name={copied === 'description' ? 'check' : 'copy'} size={15} /> {copied === 'description' ? 'Copied' : 'Copy'}</button></div></section>
          <section className="surface-card file-card"><div className="section-title"><span>04</span><div><h2>Portable project</h2><p>Keep the brief and exact parameters together.</p></div></div><div className="file-actions"><button className="secondary-button" onClick={onExportProject}><Icon name="download" size={17} /> Export project</button><label className="secondary-button file-input"><Icon name="upload" size={17} /> Import project<input type="file" accept="application/json,.json" onChange={(event) => { onImportProject(event.target.files?.[0]); event.target.value = ''; }} /></label></div></section>
        </div>
      </div>

      <section className="library-section"><div className="library-heading"><div><span className="eyebrow">Stored in this browser</span><h2>Project shelf</h2></div><span>{saved.length}/100 saved</span></div>{saved.length === 0 ? <div className="empty-library"><Icon name="folder" /><div><strong>No saved projects yet</strong><p>Save a promising variation before pushing the silhouette further.</p></div></div> : <div className="project-grid">{saved.map((item) => <article key={item.id}><span className={`project-orb design-${item.parameters.design}`} style={{ backgroundColor: item.parameters.color }} /><div><small>{item.collection || 'Unsorted collection'}</small><h3>{item.name || 'Untitled accessory'}</h3><p>{item.parameters.design} · {item.parameters.count} parts · {item.bodyScale}</p></div><footer><button onClick={() => onLoad(item)}>Open</button><button aria-label={`Delete ${item.name || 'untitled accessory'}`} onClick={() => onDelete(item.id)}><Icon name="trash" size={15} /></button></footer></article>)}</div>}</section>
    </div>
  );
}
