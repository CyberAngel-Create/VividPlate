import { useLocation } from "wouter";

const HomeSimple = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-4">VividPlate</h1>
          <p className="text-xl text-gray-600 mb-8">Digital Menu Platform for Restaurants</p>
          
          <div className="space-x-4">
            <button 
              onClick={() => setLocation("/login")}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => setLocation("/register")}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Register
            </button>
            <button 
              onClick={() => setLocation("/fast-login")}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Quick Login
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">QR Code Menus</h3>
            <p className="text-gray-600">Create contactless dining experiences with QR code menus</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Easy Management</h3>
            <p className="text-gray-600">Simple interface to manage your restaurant menu items</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Mobile Optimized</h3>
            <p className="text-gray-600">Perfect viewing experience on all devices</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSimple;