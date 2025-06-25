// Complete rollback - pure static React component with no dependencies
import React from 'react';

export default function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)'
    }}>
      {/* Header */}
      <header style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#f59e0b',
          margin: '0 0 0.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          VividPlate
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          margin: 0
        }}>
          Digital Menu Platform for Modern Restaurants
        </p>
      </header>

      {/* Main Content */}
      <main style={{ padding: '3rem 2rem' }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          marginBottom: '4rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '3rem',
          borderRadius: '1rem',
          maxWidth: '800px',
          margin: '0 auto 4rem auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1.5rem'
          }}>
            Transform Your Restaurant Experience
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            Create beautiful digital menus, generate QR codes instantly, and provide contactless dining experiences for your customers.
          </p>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.backgroundColor = '#d97706';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = '#f59e0b';
              }}
              onClick={() => alert('This is a rollback demo version. All features have been disabled for today.')}
            >
              Restaurant Login
            </button>
            
            <button
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = '#dc2626';
              }}
              onClick={() => alert('This is a rollback demo version. Admin panel has been disabled for today.')}
            >
              Admin Panel
            </button>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.5rem',
            border: '1px solid #f59e0b'
          }}>
            <p style={{
              color: '#92400e',
              fontSize: '0.9rem',
              fontWeight: '500',
              margin: 0
            }}>
              ⚠️ ROLLBACK VERSION - All today's changes have been removed. This is a static demo only.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem'
            }}>
              📱
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              QR Code Menus
            </h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Generate instant QR codes for contactless dining. Perfect for modern restaurant experiences.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem'
            }}>
              ⚡
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Easy Setup
            </h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Get your digital menu ready in minutes. No technical knowledge required.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem'
            }}>
              💻
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Mobile Ready
            </h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Beautiful menus that work perfectly on all devices. Responsive design guaranteed.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        textAlign: 'center',
        padding: '2rem',
        marginTop: '4rem'
      }}>
        <p style={{
          color: '#9ca3af',
          fontSize: '0.9rem',
          margin: 0
        }}>
          © 2025 VividPlate - Digital Menu Platform (Rollback Demo Version)
        </p>
      </footer>
    </div>
  );
}