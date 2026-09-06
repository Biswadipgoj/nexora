'use client';

import React, { useState } from 'react';
import { TiltCard } from '@/components/ui/motion/TiltCard';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import AndroidRoundedIcon from '@mui/icons-material/AndroidRounded';
import WindowRoundedIcon from '@mui/icons-material/WindowRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';

/**
 * Feature section — Master Design Document, section 6.1.
 *
 * "The feature section should use three or four product-led cards: Plan
 * clearly, Move work visibly, Finish together, and Stay in control. Each card
 * should show a cropped product state or a precise UI illustration, not an
 * abstract AI-generated scene."
 *
 * The previous version carried a "Weekly Team Velocity" chart built from
 * hard-coded numbers and a security card claiming "continuous compliance
 * verification". Both were invented. Section 6.1 allows a claim only when it is
 * "backed by a visible source and real product data", so every statement below
 * describes behaviour that exists in this repository, and the micro-widgets
 * show real interface states rather than fictional metrics.
 */
export function DimensionalFeatureGrid() {
  const [platform, setPlatform] = useState<'web' | 'win' | 'android'>('web');

  return (
    <section id="features" className="feature-section">
      <div className="feature-header-text">
        <h2 className="feature-title">Built around how work actually moves</h2>
        <p className="feature-card-desc" style={{ maxWidth: 560, margin: '0 auto' }}>
          Four things a team needs from a tracker, and nothing that gets in the way of them.
        </p>
      </div>

      <div className="feature-grid-4">
        {/* 1 — Plan clearly */}
        <TiltCard glowColor="rgba(110, 168, 255, 0.22)">
          <div className="tilt-card-inner">
            <div>
              <div className="feature-icon-avatar feature-icon-avatar--blue">
                <ViewKanbanRoundedIcon sx={{ fontSize: 24 }} />
              </div>
              <h3 className="feature-card-title">Plan clearly</h3>
              <p className="feature-card-desc">
                Projects carry a short key, so every task has a name people can say out loud. Set status, priority,
                assignee and a due date — nothing more to fill in.
              </p>
            </div>

            <div className="feature-micro-widget">
              <div className="feature-micro-row">
                <span className="feature-chip feature-chip--mono">APP-104</span>
                <span className="feature-micro-title">Stripe checkout integration</span>
              </div>
              <div className="feature-micro-row">
                <span className="badge-priority badge-priority--high">High</span>
                <span className="feature-chip">In progress</span>
                <span className="feature-micro-meta">Due Friday</span>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* 2 — Move work visibly */}
        <TiltCard glowColor="rgba(155, 140, 255, 0.22)">
          <div className="tilt-card-inner">
            <div>
              <div className="feature-icon-avatar feature-icon-avatar--violet">
                <SwapHorizRoundedIcon sx={{ fontSize: 24 }} />
              </div>
              <h3 className="feature-card-title">Move work visibly</h3>
              <p className="feature-card-desc">
                Drag a card, or move it from the keyboard without touching the mouse. Column counts update as you go,
                so the board always says how much is in flight.
              </p>
            </div>

            <div className="feature-micro-widget">
              <div className="feature-columns">
                <span className="feature-column">
                  <span className="feature-column__dot feature-column__dot--todo" />
                  To do <b>6</b>
                </span>
                <span className="feature-column feature-column--active">
                  <span className="feature-column__dot feature-column__dot--progress" />
                  In progress <b>3</b>
                </span>
                <span className="feature-column">
                  <span className="feature-column__dot feature-column__dot--done" />
                  Done <b>12</b>
                </span>
              </div>
              <div className="feature-micro-meta">
                Press <kbd className="kbd-shortcut">←</kbd> <kbd className="kbd-shortcut">→</kbd> to change status
              </div>
            </div>
          </div>
        </TiltCard>

        {/* 3 — Finish together */}
        <TiltCard glowColor="rgba(87, 211, 154, 0.22)">
          <div className="tilt-card-inner">
            <div>
              <div className="feature-icon-avatar feature-icon-avatar--green">
                <GroupsRoundedIcon sx={{ fontSize: 24 }} />
              </div>
              <h3 className="feature-card-title">Finish together</h3>
              <p className="feature-card-desc">
                Open a task to see its history, leave a comment, and hand it on. Share a project by link when someone
                needs to look without joining the workspace.
              </p>
            </div>

            <div className="feature-micro-widget">
              <div className="feature-activity">
                <span className="feature-activity__row">
                  <span className="feature-activity__dot" />
                  Moved to <b>In review</b>
                </span>
                <span className="feature-activity__row">
                  <span className="feature-activity__dot" />
                  Assigned to <b>Priya</b>
                </span>
                <span className="feature-activity__row">
                  <span className="feature-activity__dot" />
                  Comment added
                </span>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* 4 — Stay in control */}
        <TiltCard glowColor="rgba(70, 215, 232, 0.22)">
          <div className="tilt-card-inner">
            <div>
              <div className="feature-icon-avatar feature-icon-avatar--cyan">
                <ShieldRoundedIcon sx={{ fontSize: 24 }} />
              </div>
              <h3 className="feature-card-title">Stay in control</h3>
              <p className="feature-card-desc">
                Workspaces are isolated in the database itself, not just in the interface, and the same account works
                on the web, on Windows and on Android.
              </p>
            </div>

            <div className="feature-micro-widget">
              <div className="platform-btn-group" role="tablist" aria-label="Available platforms">
                {(
                  [
                    ['web', 'Web', LanguageRoundedIcon],
                    ['win', 'Windows', WindowRoundedIcon],
                    ['android', 'Android', AndroidRoundedIcon],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={platform === id}
                    onClick={() => setPlatform(id)}
                    className={`platform-btn ${platform === id ? 'platform-btn--active' : ''}`}
                  >
                    <Icon sx={{ fontSize: 15 }} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="platform-info-row">
                {platform === 'web' && 'Runs in the browser, no install needed.'}
                {platform === 'win' && 'Desktop window with the same keyboard shortcuts.'}
                {platform === 'android' && 'Bottom navigation built for one thumb.'}
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
