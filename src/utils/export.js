/**
 * Export the current project state to a JSON file download.
 */
export function exportProject(state) {
  const data = JSON.stringify({
    format: 'althoff-yield-project',
    version: 1,
    savedAt: new Date().toISOString(),
    projectName: state.projectName || '',
    stock: state.stock,
    parts: state.parts,
    settings: state.settings,
    resawStock: state.resawStock,
    resawSettings: state.resawSettings,
    crosscutSettings: state.crosscutSettings,
    resawSkus: state.resawSkus,
    binSettings: state.binSettings,
  }, null, 2);

  const slug = String(state.projectName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'yield-plan'}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a file picker and import project from JSON.
 * onLoad(data) is called with the parsed object on success.
 * onError(message) is called with a plain-language message on failure —
 * previously a valid-JSON file of the wrong shape threw past this and left
 * the app on a blank page with no explanation.
 */
export function importProject(onLoad, onError = () => {}) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => onError("That file couldn't be read. Try exporting it again.");
    reader.onload = (ev) => {
      let data;
      try {
        data = JSON.parse(ev.target.result);
      } catch {
        onError('That file isn\'t valid JSON. Pick a project file exported from this app.');
        return;
      }
      try {
        onLoad(data);
      } catch (err) {
        onError(err?.message || "That file couldn't be loaded as a project.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
