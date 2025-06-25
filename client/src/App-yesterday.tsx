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