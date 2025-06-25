import { Switch, Route } from "wouter";

const Home = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", padding: "2rem", maxWidth: "600px" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
      <p style={{ color: "#6b7280", fontSize: "1.25rem", marginBottom: "2rem" }}>Digital Menu Platform for Restaurants</p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Restaurant Login</a>
        <a href="/admin-login" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Admin Panel</a>
      </div>
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "0.5rem" }}>
        <h3 style={{ color: "#374151", marginBottom: "0.5rem" }}>Test Accounts:</h3>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Admin: admin / admin1234</p>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Restaurant: restaurant1 / password123</p>
      </div>
    </div>
  </div>
);

const Login = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Restaurant Login</h1>
      <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

const AdminLogin = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px", border: "2px solid #fecaca" }}>
      <h1 style={{ color: "#dc2626", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Admin Login</h1>
      <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

const Dashboard = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h1>Simple Dashboard</h1>
    <p>Yesterday's simple version</p>
    <a href="/" style={{ color: "#dc2626" }}>Back to Home</a>
  </div>
);

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/dashboard" component={Dashboard} />
      <Route component={() => <div style={{ padding: "2rem", textAlign: "center" }}><h1>Page Not Found</h1><a href="/">Go Home</a></div>} />
    </Switch>
  );
}

export default App;