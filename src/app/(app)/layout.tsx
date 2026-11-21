import TackleboxApp from '../../components/TackleboxApp';

/**
 * The signed-in app is one persistent shell: gear, Plan, Pack lists, Restock
 * and the checklists are sections of it, each with its own URL. Keeping the
 * shell in a layout means moving between them keeps state (gear, the current
 * trip plan) and the browser's Back button works. The route pages render nothing.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TackleboxApp />
      {children}
    </>
  );
}
