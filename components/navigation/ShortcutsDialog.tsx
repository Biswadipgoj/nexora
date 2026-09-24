'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const SHORTCUTS: Array<[string, string[]]> = [
  ['Search and commands', ['Ctrl', 'K']],
  ['New task', ['C']],
  ['Open the focused card', ['Enter']],
  ['Move the focused card', ['←', '→']],
  ['Close a dialog or drawer', ['Esc']],
  ['Show this list', ['?']],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="shortcuts-title">
      <div className="nx-sheet-head">
        <div>
          <h2 id="shortcuts-title" className="nx-sheet-title">
            Keyboard shortcuts
          </h2>
          <p className="nx-sheet-sub">On a Mac, use ⌘ in place of Ctrl.</p>
        </div>
        <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close">
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>
      <div className="nx-sheet-body">
        <dl className="shortcuts">
          {SHORTCUTS.map(([label, keys]) => (
            <React.Fragment key={label}>
              <dt>{label}</dt>
              <dd>
                {keys.map((k) => (
                  <kbd key={k} className="nx-kbd">
                    {k}
                  </kbd>
                ))}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}
