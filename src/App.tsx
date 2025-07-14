import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";
import { SubsectionPage } from "./pages/SubsectionPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course/:courseId" 
              element={
                <ProtectedRoute>
                  <CoursePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course/:courseId/lesson/:lessonId" 
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course/:courseId/subsection/:subsectionId" 
              element={
                <ProtectedRoute>
                  <SubsectionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        {/* Future admin routes will go here */}
                      </Routes>
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
