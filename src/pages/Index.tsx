import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pipeline } from "@/components/landing/Pipeline";
import { GraphVisualization } from "@/components/graph/GraphVisualization";
import { QueryInterface } from "@/components/query/QueryInterface";
import { DummyDataManager } from "@/components/data/DummyDataManager";
import { DummyDataInitializer } from "@/components/data/DummyDataInitializer";
import { DemoGuide } from "@/components/demo/DemoGuide";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null);
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={handleLogout} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <DummyDataInitializer />
      <DemoGuide />
      <Hero />
      <Features />
      <Pipeline />
      <div className="container mx-auto px-4 py-20">
        <DummyDataManager />
      </div>
      <div className="container mx-auto px-4 py-20">
        <GraphVisualization />
      </div>
      <div className="container mx-auto px-4 py-20">
        <QueryInterface />
      </div>
    </main>
  );
};

export default Index;
