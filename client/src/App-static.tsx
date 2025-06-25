// Completely static app - no authentication, no API calls
function App() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)" }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h1 style={{ 
          color: "#f59e0b", 
          fontSize: "3rem", 
          fontWeight: "bold", 
          marginBottom: "1rem",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
        }}>
          VividPlate
        </h1>
        <p style={{ 
          color: "#6b7280", 
          fontSize: "1.2rem", 
          marginBottom: "3rem", 
          maxWidth: "600px", 
          margin: "0 auto 3rem",
          lineHeight: "1.6"
        }}>
          Transform your restaurant with beautiful digital menus. Create, customize, and share your menu instantly with QR codes.
        </p>
        
        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button 
            style={{ 
              backgroundColor: "#f59e0b", 
              color: "white", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.5rem", 
              border: "none",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#d97706"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#f59e0b"}
            onClick={() => alert("This is a static demo. Login functionality disabled in rollback version.")}
          >
            Restaurant Login
          </button>
          <button 
            style={{ 
              backgroundColor: "#dc2626", 
              color: "white", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.5rem", 
              border: "none",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#b91c1c"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#dc2626"}
            onClick={() => alert("This is a static demo. Admin functionality disabled in rollback version.")}
          >
            Admin Login
          </button>
        </div>
        
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          ⚠️ Rollback Version - Authentication and admin features are disabled
        </p>
      </div>
      
      {/* Features Section */}
      <div style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ 
            color: "#1f2937", 
            fontSize: "2rem", 
            fontWeight: "bold", 
            textAlign: "center", 
            marginBottom: "3rem" 
          }}>
            Why Choose VividPlate?
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "2rem" 
          }}>
            <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                backgroundColor: "#f59e0b", 
                borderRadius: "50%", 
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                ⚡
              </div>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Easy Setup
              </h3>
              <p style={{ color: "#6b7280", lineHeight: "1.5" }}>
                Get your digital menu ready in minutes with our intuitive interface. No technical knowledge required.
              </p>
            </div>
            
            <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                backgroundColor: "#f59e0b", 
                borderRadius: "50%", 
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                📱
              </div>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                QR Codes
              </h3>
              <p style={{ color: "#6b7280", lineHeight: "1.5" }}>
                Generate QR codes instantly for contactless dining experiences. Perfect for modern restaurants.
              </p>
            </div>
            
            <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                backgroundColor: "#f59e0b", 
                borderRadius: "50%", 
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                💻
              </div>
              <h3 style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Mobile Ready
              </h3>
              <p style={{ color: "#6b7280", lineHeight: "1.5" }}>
                Beautiful menus that work perfectly on all devices. Responsive design for optimal user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ padding: "2rem", backgroundColor: "#1f2937", color: "white", textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          © 2025 VividPlate - Digital Menu Platform (Static Demo Version)
        </p>
      </div>
    </div>
  );
}

export default App;