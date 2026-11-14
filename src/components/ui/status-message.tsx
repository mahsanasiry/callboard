export function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="notice">
      {children}
    </p>
  );
}
