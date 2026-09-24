'use client';

import React, { useState } from 'react';
import { Avatar, PriorityMark } from '@/components/ui/Marks';

/**
 * "How it works": four rows, each a sentence about behaviour that exists in
 * this codebase and a fragment of the real interface beside it — no invented
 * metrics, no illustrations of things the product does not do.
 */
export function DimensionalFeatureGrid() {
  const [platform, setPlatform] = useState<'web' | 'windows' | 'android'>('web');

  const platformNote = {
    web: 'Runs in the browser. Nothing to install.',
    windows: 'A desktop window with the same keyboard shortcuts.',
    android: 'Bottom navigation built for one thumb.',
  }[platform];

  return (
    <section id="how" className="lp-how" aria-labelledby="how-title">
      <div className="lp-how__intro">
        <p className="nx-eyebrow">How it works</p>
        <h2 id="how-title" className="lp-h2" style={{ marginTop: 14 }}>
          Built around how work actually moves.
        </h2>
        <p>Four things a team needs from a tracker, and nothing that gets in the way of them.</p>
      </div>

      <div className="lp-how__rows">
        <article className="lp-how__row">
          <div>
            <span className="lp-how__label">Plan</span>
            <h3 className="lp-how__title">Every task has a name you can say.</h3>
            <p className="lp-how__body">
              Projects carry a short key, so work is APP-104, not “that checkout thing”. Status, priority, owner and
              a due date — nothing more to fill in.
            </p>
          </div>
          <div className="lp-fragment" aria-hidden="true">
            <div className="lp-fragment__row">
              <span className="nx-key">APP-104</span>
              <span className="lp-fragment__title">Stripe checkout integration</span>
            </div>
            <div className="lp-fragment__row">
              <PriorityMark priority={3} />
              <span className="nx-chip nx-chip--amber">In progress</span>
              <span>Due Friday</span>
            </div>
          </div>
        </article>

        <article className="lp-how__row">
          <div>
            <span className="lp-how__label">Move</span>
            <h3 className="lp-how__title">Drag it, or never touch the mouse.</h3>
            <p className="lp-how__body">
              Cards move by drag, by menu, or with the arrow keys. Column counts update as you go, so the board always
              says how much is in flight.
            </p>
          </div>
          <div className="lp-fragment" aria-hidden="true">
            <div className="lp-fragment__row" style={{ gap: 18 }}>
              <span className="lp-lanecount">
                <span className="lane-dot lane-dot--todo" /> To Do <b>6</b>
              </span>
              <span className="lp-lanecount">
                <span className="lane-dot lane-dot--progress" /> In Progress <b>3</b>
              </span>
              <span className="lp-lanecount">
                <span className="lane-dot lane-dot--done" /> Done <b>12</b>
              </span>
            </div>
            <div className="lp-fragment__row">
              Focus a card, then <kbd className="nx-kbd">←</kbd> <kbd className="nx-kbd">→</kbd> to change its status
            </div>
          </div>
        </article>

        <article className="lp-how__row">
          <div>
            <span className="lp-how__label">Finish</span>
            <h3 className="lp-how__title">Hand work on without a meeting.</h3>
            <p className="lp-how__body">
              Open a task to change it in place. Invite someone to a project with a private link, or share a
              read-only link with people who only need to look.
            </p>
          </div>
          <div className="lp-fragment" aria-hidden="true">
            <ul className="lp-activity">
              <li>
                <Avatar name="Sarah Chen" /> <span>Moved to <b>Done</b></span> <time>2m</time>
              </li>
              <li>
                <Avatar name="Alex Morgan" /> <span>Assigned to <b>Priya</b></span> <time>1h</time>
              </li>
              <li>
                <Avatar name="Priya Rao" /> <span>Joined as a member</span> <time>3h</time>
              </li>
            </ul>
          </div>
        </article>

        <article className="lp-how__row">
          <div>
            <span className="lp-how__label">Control</span>
            <h3 className="lp-how__title">Your workspace stays yours.</h3>
            <p className="lp-how__body">
              Workspaces are separated in the database itself, with row-level security on every table — not only in
              the interface. One account works on the web, on Windows and on Android.
            </p>
          </div>
          <div className="lp-fragment">
            <div className="nx-segmented" role="group" aria-label="Platforms">
              {(
                [
                  ['web', 'Web'],
                  ['windows', 'Windows'],
                  ['android', 'Android'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={platform === id} onClick={() => setPlatform(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="lp-fragment__row">{platformNote}</div>
          </div>
        </article>
      </div>
    </section>
  );
}
