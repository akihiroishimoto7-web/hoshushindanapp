import { Fragment } from 'react';
import type { Seg } from '../game/ruby';

export function RubyText({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((s, i) =>
        s.rt ? (
          <ruby key={i}>
            {s.text}
            <rt>{s.rt}</rt>
          </ruby>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}
