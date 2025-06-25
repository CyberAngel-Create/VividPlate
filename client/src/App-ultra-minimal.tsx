import { Switch, Route } from "wouter";
import React from "react";

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
          <input name="username" type="text" placeholder="Admin Username (admin)" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
          <input name="password" type="password" placeholder="Admin Password (admin1234)" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "1rem" }} />
          <button type="submit" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Admin Login</button>
        </form>
        <div style={{ textAlign: "center", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button onClick={handleQuickLogin} style={{ backgroundColor: "#b91c1c", color: "white", padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", fontSize: "0.875rem", cursor: "pointer" }}>Quick Admin Login</button>
          <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
        </div>
      </div>
    </div>
  );
};

const Home = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
      <p style={{ color: "#6b7280", fontSize: "1.25rem", marginBottom: "2rem" }}>Digital Menu Platform for Restaurants</p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" style={{ backgroundColor: "#f59e0b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Login</a>
        <a href="/admin-login" style={{ backgroundColor: "#dc2626", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Admin</a>
        <a href="/fast-login" style={{ backgroundColor: "#3b82f6", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>Quick Login</a>
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

const FastLogin = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px" }}>
      <h1 style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>Quick Login</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button style={{ backgroundColor: "#dc2626", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Admin (admin/admin1234)</button>
        <button style={{ backgroundColor: "#16a34a", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Restaurant Owner (restaurant1/password123)</button>
        <button style={{ backgroundColor: "#2563eb", color: "white", padding: "1rem", borderRadius: "0.375rem", border: "none", fontWeight: "500", cursor: "pointer" }}>Premium User (entotocloudrestaurant@gmail.com/cloud123)</button>
      </div>
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <a href="/" style={{ color: "#6b7280", textDecoration: "none" }}>Back to Home</a>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: "4rem", fontWeight: "bold", color: "#f59e0b", marginBottom: "1rem" }}>404</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>Page not found</p>
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
      <Route path="/admin" component={() => {
        try {
          const AdminDashboard = require('./pages/admin-dashboard-simple').default;
          return React.createElement(AdminDashboard);
        } catch (e) {
          return React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } }, 
            React.createElement('h1', null, 'Admin Dashboard'),
            React.createElement('p', null, 'Loading admin features...'),
            React.createElement('a', { href: '/', style: { color: '#dc2626' } }, 'Back to Home')
          );
        }
      }} />
      <Route path="/admin/dashboard" component={() => {
        try {
          const AdminDashboard = require('./pages/admin-dashboard-simple').default;
          return React.createElement(AdminDashboard);
        } catch (e) {
          return React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } }, 
            React.createElement('h1', null, 'Admin Dashboard'),
            React.createElement('p', null, 'Loading admin features...'),
            React.createElement('a', { href: '/', style: { color: '#dc2626' } }, 'Back to Home')
          );
        }
      }} />
      <Route path="/admin/users" component={() => {
        try {
          const AdminUsers = require('./pages/admin-users-simple').default;
          return React.createElement(AdminUsers);
        } catch (e) {
          return React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } }, 
            React.createElement('h1', null, 'User Management'),
            React.createElement('p', null, 'Loading user features...'),
            React.createElement('a', { href: '/admin', style: { color: '#dc2626' } }, 'Back to Admin')
          );
        }
      }} />
      <Route path="/fast-login" component={FastLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;