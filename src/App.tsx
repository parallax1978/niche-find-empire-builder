
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Home />
            </AppLayout>
          } />
          <Route path="/search" element={
            <AppLayout>
              <Search />
            </AppLayout>
          } />
          <Route path="/admin" element={
            <AppLayout>
              <Admin />
            </AppLayout>
          } />
          <Route path="/account" element={
            <AppLayout>
              <Account />
            </AppLayout>
          } />
          <Route path="/auth" element={
            <AppLayout>
              <Auth />
            </AppLayout>
          } />
          <Route path="/payment-success" element={
            <AppLayout>
              <PaymentSuccess />
            </AppLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <AppLayout>
              <NotFound />
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
