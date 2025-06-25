import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    premiumUsers: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Fetch admin stats
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  const adminSections = [
    { title: "Users Management", path: "/admin/users", description: "Manage user accounts and subscriptions" },
    { title: "Restaurants", path: "/admin/restaurants", description: "View and manage all restaurants" },
    { title: "Analytics", path: "/admin/analytics", description: "Platform usage and performance metrics" },
    { title: "Pricing", path: "/admin/pricing", description: "Subscription plans and pricing" },
    { title: "Content", path: "/admin/content", description: "Manage content and advertisements" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
              VividPlate Admin Dashboard
            </h1>
            <p style={{ color: "#6b7280" }}>Manage your restaurant platform</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={() => setLocation("/")}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              View Site
            </button>
            <button 
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' });
                setLocation('/');
              }}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>Total Users</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>{stats.totalUsers}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>Restaurants</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>{stats.totalRestaurants}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>Premium Users</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}>{stats.premiumUsers}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>Revenue</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}>${stats.totalRevenue}</p>
          </div>
        </div>

        {/* Admin Sections */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {adminSections.map((section, index) => (
            <div 
              key={index}
              onClick={() => setLocation(section.path)}
              style={{ 
                backgroundColor: "white", 
                padding: "1.5rem", 
                borderRadius: "0.5rem", 
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                {section.title}
              </h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                {section.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: "2rem", backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Quick Actions</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button 
              onClick={() => setLocation("/admin/users")}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              Manage Users
            </button>
            <button 
              onClick={() => setLocation("/admin/restaurants")}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              View Restaurants
            </button>
            <button 
              onClick={() => window.open("/api/admin/export", "_blank")}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              Export Data
            </button>
            <button 
              onClick={() => setLocation("/admin/analytics")}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              View Analytics
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;