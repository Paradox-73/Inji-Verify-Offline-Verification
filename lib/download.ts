// lib/download.ts
export function downloadJson(filename: string, data: unknown) {
  // Ensure the payload is serializable and dates are strings
  const json = JSON.stringify(data, (_k, v) => (
    v instanceof Date ? v.toISOString() : v
  ), 2);

  const blob = new Blob([json], { type: 'application/json' });

  // iOS Safari sometimes ignores the download attribute on anchors.
  // Try msSaveOrOpenBlob (old Edge/IE), then fall back to clicking a link.
  // As a last resort, open a data URL in a new tab.
  // @ts-ignore
  if (typeof window !== 'undefined' && window.navigator?.msSaveOrOpenBlob) {
    // @ts-ignore
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Some Safari/iOS versions require the link to be in the DOM
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Revoke shortly after to avoid “user gesture” races on iOS
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


