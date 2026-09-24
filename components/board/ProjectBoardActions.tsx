'use client';

import React, { useState } from 'react';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import { ShareProjectModal } from './ShareProjectModal';

/** The project page's share button and dialog. */
export function ProjectBoardActions(props: {
  projectId: string;
  projectName: string;
  projectKey: string;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={() => setOpen(true)}>
        <IosShareRoundedIcon sx={{ fontSize: 15 }} />
        Share
      </button>
      <ShareProjectModal isOpen={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
