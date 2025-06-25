import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
}

const AdminUsers = () => {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeUserToPremium = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'premium', duration: '1 month' })
      });
      
      if (response.ok) {
        alert('User upgraded to premium successfully');
        fetchUsers();
        setShowUpgradeModal(false);
        setSelectedUser(null);
      } else {
        alert('Failed to upgrade user');
      }
    } catch (error) {
      alert('Error upgrading user');
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      alert('Error updating user status');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Loading users...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
              User Management
            </h1>
            <p style={{ color: "#6b7280" }}>Manage user accounts and subscriptions</p>
          </div>
          <button 
            onClick={() => setLocation("/admin")}
            style={{ padding: "0.5rem 1rem", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Users Table */}
        <div style={{ backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>All Users ({users.length})</h3>
          </div>
          
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#f9fafb" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>User</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>Email</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>Subscription</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>Joined</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#374151", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#1f2937" }}>
                      <div style={{ fontWeight: "500" }}>{user.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>ID: {user.id}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#1f2937" }}>{user.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "0.25rem", 
                        fontSize: "0.75rem", 
                        fontWeight: "500",
                        backgroundColor: user.subscriptionTier === 'premium' ? '#dcfce7' : '#f3f4f6',
                        color: user.subscriptionTier === 'premium' ? '#059669' : '#374151'
                      }}>
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "0.25rem", 
                        fontSize: "0.75rem", 
                        fontWeight: "500",
                        backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                        color: user.isActive ? '#059669' : '#dc2626'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {user.subscriptionTier === 'free' && (
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUpgradeModal(true);
                            }}
                            style={{ 
                              padding: "0.25rem 0.5rem", 
                              backgroundColor: "#3b82f6", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "0.25rem", 
                              fontSize: "0.75rem", 
                              cursor: "pointer" 
                            }}
                          >
                            Upgrade
                          </button>
                        )}
                        <button 
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          style={{ 
                            padding: "0.25rem 0.5rem", 
                            backgroundColor: user.isActive ? "#dc2626" : "#059669", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "0.25rem", 
                            fontSize: "0.75rem", 
                            cursor: "pointer" 
                          }}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && selectedUser && (
          <div style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.5)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{ 
              backgroundColor: "white", 
              padding: "2rem", 
              borderRadius: "0.5rem", 
              maxWidth: "400px", 
              width: "90%" 
            }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                Upgrade User to Premium
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                Upgrade {selectedUser.username} to premium subscription?
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedUser(null);
                  }}
                  style={{ 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#6b7280", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "0.375rem", 
                    cursor: "pointer" 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => upgradeUserToPremium(selectedUser.id)}
                  style={{ 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#3b82f6", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "0.375rem", 
                    cursor: "pointer" 
                  }}
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;