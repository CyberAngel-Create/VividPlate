function App() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "600px" }}>
        <h1 style={{ color: "#f59e0b", fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
        <p style={{ color: "#6b7280", fontSize: "1.25rem", marginBottom: "2rem" }}>Digital Menu Platform for Restaurants</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Restaurant Login</button>
          <button style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Admin Panel</button>
        </div>
        <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "0.5rem" }}>
          <h3 style={{ color: "#374151", marginBottom: "0.5rem" }}>Test Accounts:</h3>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Admin: admin / admin1234</p>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Restaurant: restaurant1 / password123</p>
        </div>
      </div>
    </div>
  );
}

export default App;