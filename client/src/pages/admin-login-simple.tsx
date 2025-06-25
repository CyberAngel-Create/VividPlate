import { useState } from "react";
import { useLocation } from "wouter";

const AdminLoginSimple = () => {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        setLocation("/admin/dashboard");
      } else {
        alert("Admin login failed");
      }
    } catch (error) {
      alert("Login error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setUsername("admin");
    setPassword("admin1234");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin1234" }),
      });
      
      if (response.ok) {
        setLocation("/admin/dashboard");
      } else {
        alert("Admin login failed");
      }
    } catch (error) {
      alert("Login error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-red-200">
        <h1 className="text-2xl font-bold text-red-600 mb-6 text-center">Admin Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              placeholder="admin"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              placeholder="admin1234"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Admin Login"}
          </button>
        </form>
        
        <div className="mt-6 space-y-3">
          <button 
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Quick Admin Login (admin/admin1234)
          </button>
          
          <div className="text-center">
            <button 
              onClick={() => setLocation("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginSimple;