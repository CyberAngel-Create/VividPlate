// Completely static app without any API calls or hooks
function App() {
  const currentPath = window.location.pathname;

  if (currentPath === '/login') {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px" }}>
          <h1 style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Restaurant Login</h1>
          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Username" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
            <input type="password" placeholder="Password" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
            <button type="submit" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Login</button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === '/admin-login') {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px", border: "2px solid #fecaca" }}>
          <h1 style={{ color: "#dc2626", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Admin Login</h1>
          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Admin Username" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
            <input type="password" placeholder="Admin Password" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
            <button type="submit" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Admin Login</button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  // Default home page
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)" }}>
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h1 style={{ color: "#f59e0b", fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
        <p style={{ color: "#6b7280", fontSize: "1.2rem", marginBottom: "3rem", maxWidth: "600px", margin: "0 auto 3rem" }}>
          Transform your restaurant with beautiful digital menus. Create, customize, and share your menu instantly.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/login" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>
            Restaurant Login
          </a>
          <a href="/admin-login" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>
            Admin Login
          </a>
        </div>
      </div>
      
      <div style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ color: "#1f2937", fontSize: "2rem", fontWeight: "bold", textAlign: "center", marginBottom: "3rem" }}>Why Choose VividPlate?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Easy Setup</h3>
              <p style={{ color: "#6b7280" }}>Get your digital menu ready in minutes with our intuitive interface.</p>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>QR Codes</h3>
              <p style={{ color: "#6b7280" }}>Generate QR codes instantly for contactless dining experiences.</p>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Mobile Ready</h3>
              <p style={{ color: "#6b7280" }}>Beautiful menus that work perfectly on all devices.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;