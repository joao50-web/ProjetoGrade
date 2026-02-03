export default function GradeLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        padding: '35px 48px',
      }}
    >
      <div
        style={{
          background: '#c3d6e9',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          borderLeft: '5px solid #000000',
        }}
      >
        {children}
      </div>
    </div>
  );
}