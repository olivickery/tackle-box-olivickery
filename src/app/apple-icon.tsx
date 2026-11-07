import { ImageResponse } from 'next/og';

// iOS home-screen icon (iOS rounds the corners itself, so fill edge to edge).
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: 92, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>IQ</div>
        <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>Tacklebox</div>
      </div>
    ),
    size
  );
}
