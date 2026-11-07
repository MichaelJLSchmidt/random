import site from '@content/site.json'

/** The "?" sheet: a native modal dialog listing every shortcut. */
let dialog: HTMLDialogElement | null = null

export function showShortcuts() {
  if (!dialog) {
    dialog = document.createElement('dialog')
    dialog.className = 'sheet'
    dialog.setAttribute('aria-labelledby', 'sheet-title')
    const rows = site.eggs.shortcuts.map(() => '<div><dt><kbd></kbd></dt><dd></dd></div>').join('')
    dialog.innerHTML = `<h2 id="sheet-title"></h2><dl>${rows}</dl><form method="dialog"><button class="pill"></button></form>`
    dialog.querySelector('h2')!.textContent = site.eggs.shortcutsTitle
    dialog.querySelectorAll('dl > div').forEach((row, i) => {
      row.querySelector('kbd')!.textContent = site.eggs.shortcuts[i].keys
      row.querySelector('dd')!.textContent = site.eggs.shortcuts[i].what
    })
    dialog.querySelector('button')!.textContent = site.eggs.shortcutsClose
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog?.close()
    })
    document.body.append(dialog)
  }
  if (!dialog.open) dialog.showModal()
}
