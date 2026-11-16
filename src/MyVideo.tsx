import React from 'react';
import { Composition } from 'remotion';

export const DefaultComp: React.FC = () => (
  <div style={{ flex: 1, backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 55 }}>
    AI Studio Pro V10 Ready
  </div>
);

export const MyVideo: React.FC = () => (
  <>
    <Composition id="MyVideo" component={DefaultComp} durationInFrames={1800} fps={30} width={1280} height={720} />
    <Composition id="MyShort" component={DefaultComp} durationInFrames={1350} fps={30} width={720} height={1280} />
  </>
);
