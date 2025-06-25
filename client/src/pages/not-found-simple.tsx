import { useLocation } from "wouter";

const NotFoundSimple = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-orange-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <button 
          onClick={() => setLocation("/")}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundSimple;