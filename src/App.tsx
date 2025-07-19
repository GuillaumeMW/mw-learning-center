import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminRedirect from "@/components/AdminRedirect";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";
import { SubsectionPage } from "./pages/SubsectionPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import UserDetail from "./pages/admin/UserDetail";
import ContentManagement from "./pages/admin/ContentManagement";
import SubsectionEditor from "./pages/admin/SubsectionEditor";
import ProgressAnalytics from "./pages/admin/ProgressAnalytics";
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
                  <AdminRedirect>
                    <Index />
                  </AdminRedirect>
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
                        <Route path="users" element={<UsersManagement />} />
                        <Route path="users/:userId" element={<UserDetail />} />
                        <Route path="content" element={<ContentManagement />} />
                        <Route path="content/subsection/:sectionId" element={<SubsectionEditor />} />
                        <Route path="analytics" element={<ProgressAnalytics />} />
                        {/* Future admin routes will go here */}
                      </Routes>
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account-settings" 
              element={
                <ProtectedRoute>
                  <AccountSettings />
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
