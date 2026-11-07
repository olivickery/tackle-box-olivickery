import { ImageResponse } from 'next/og';

// Browser tab / favicon: amber "IQ" on the app's slate background.
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          borderRadius: 14,
          color: '#f59e0b',
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        IQ
      </div>
    ),
    size
  );
}
