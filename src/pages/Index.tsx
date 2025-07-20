import CourseDashboard from "@/components/CourseDashboard";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <CourseDashboard />
      </div>
    </div>
  );
};

export default Index;
