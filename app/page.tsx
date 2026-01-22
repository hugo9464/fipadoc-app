export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1a1a1a',
        }}
      >
        FIPADOC
      </h1>
      <p
        style={{
          fontSize: '1.25rem',
          color: '#666',
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        Programme du festival international du documentaire
      </p>
      <div
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}
      >
        <p
          style={{
            fontSize: '0.875rem',
            color: '#888',
            margin: 0,
          }}
        >
          PWA Foundation Ready
        </p>
      </div>
    </main>
  );
}
