import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/home-simple";
import Login from "./pages/login-simple";
// import Register from "./pages/register";
// import Dashboard from "./pages/dashboard";
// import FastLogin from "./pages/fast-login";
import NotFound from "./pages/not-found-simple";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={() => <div className="p-8 text-center">Register page coming soon</div>} />
            <Route path="/dashboard" component={() => <div className="p-8 text-center">Dashboard coming soon</div>} />
            <Route path="/fast-login" component={() => <div className="p-8 text-center">Fast login coming soon</div>} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;