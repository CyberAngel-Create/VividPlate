import { useState } from "react";
import { useLocation } from "wouter";

const LoginSimple = () => {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        setLocation("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (error) {
      alert("Login error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-orange-600 mb-6 text-center">Login to VividPlate</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Login
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <button 
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            Back to Home
          </button>
          <br />
          <button 
            onClick={() => setLocation("/fast-login")}
            className="text-blue-600 hover:text-blue-800"
          >
            Quick Login with Test Accounts
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSimple;