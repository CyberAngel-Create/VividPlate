import { Switch, Route } from "wouter";
import React from "react";

const Home = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", padding: "2rem", maxWidth: "600px" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
      <p style={{ color: "#6b7280", fontSize: "1.25rem", marginBottom: "2rem" }}>Digital Menu Platform for Restaurants</p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Restaurant Login</a>
        <a href="/admin-login" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Admin Panel</a>
        <a href="/fast-login" style={{ backgroundColor: "#059669", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Quick Demo</a>
      </div>
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "0.5rem" }}>
        <h3 style={{ color: "#374151", marginBottom: "0.5rem" }}>Available Test Accounts:</h3>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Admin: admin / admin1234</p>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Restaurant: restaurant1 / password123</p>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>Premium User: entotocloudrestaurant@gmail.com / cloud123</p>
      </div>
    </div>
  </div>
);

const Login = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Login to VividPlate</h1>
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

const AdminLogin = () => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const credentials = {
      identifier: formData.get('username'),
      password: formData.get('password')
    };
    
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        alert('Admin login failed');
      }
    } catch (error) {
      alert('Login error');
    }
  };

  const handleQuickLogin = async () => {
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin', password: 'admin1234' })
      });
      
      if (response.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        alert('Admin login failed');
      }
    } catch (error) {
      alert('Login error');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px", border: "2px solid #fecaca" }}>
        <h1 style={{ color: "#dc2626", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Admin Login</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input name="username" type="text" placeholder="Admin Username" style={{ padding: "0.75rem", border: "2px solid #fecaca", borderRadius: "0.375rem", fontSize: "1rem" }} />
          <input name="password" type="password" placeholder="Admin Password" style={{ padding: "0.75rem", border: "2px solid #fecaca", borderRadius: "0.375rem", fontSize: "1rem" }} />
          <button type="submit" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Admin Login</button>
        </form>
        <div style={{ textAlign: "center", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button onClick={handleQuickLogin} style={{ backgroundColor: "#059669", color: "white", padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", fontSize: "0.875rem", cursor: "pointer" }}>Quick Login (admin/admin1234)</button>
          <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
        </div>
      </div>
    </div>
  );
};

const FastLogin = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px" }}>
      <h1 style={{ color: "#059669", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Quick Demo Access</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button style={{ backgroundColor: "#f59e0b", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer", textAlign: "left" }}>
          <strong>Restaurant Owner Demo</strong><br />
          <small>Username: restaurant1 | Password: password123</small>
        </button>
        <button style={{ backgroundColor: "#8b5cf6", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer", textAlign: "left" }}>
          <strong>Premium User Demo</strong><br />
          <small>Email: entotocloudrestaurant@gmail.com | Password: cloud123</small>
        </button>
        <button style={{ backgroundColor: "#dc2626", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer", textAlign: "left" }}>
          <strong>Admin Panel Demo</strong><br />
          <small>Username: admin | Password: admin1234</small>
        </button>
      </div>
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "4rem", fontWeight: "bold", marginBottom: "1rem" }}>404</h1>
      <p style={{ color: "#6b7280", fontSize: "1.25rem", marginBottom: "2rem" }}>Page not found</p>
      <a href="/" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Go Home</a>
    </div>
  </div>
);

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={() => <div style={{ padding: "2rem", textAlign: "center" }}><h1>Admin Dashboard</h1><p>Admin features coming soon</p><a href="/" style={{ color: "#dc2626" }}>Back to Home</a></div>} />
      <Route path="/admin/dashboard" component={() => <div style={{ padding: "2rem", textAlign: "center" }}><h1>Admin Dashboard</h1><p>Admin features coming soon</p><a href="/" style={{ color: "#dc2626" }}>Back to Home</a></div>} />
      <Route path="/fast-login" component={FastLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;