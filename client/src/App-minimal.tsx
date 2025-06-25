import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/home-simple";
import Login from "./pages/login-simple";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import FastLogin from "./pages/fast-login";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/fast-login" component={FastLogin} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;