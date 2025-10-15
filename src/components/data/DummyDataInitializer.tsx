import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const DummyDataInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    checkAndInitializeData();
  }, []);

  const checkAndInitializeData = async () => {
    try {
      // Check if data already exists (type cast to work around type generation timing)
      const { count } = await (supabase as any)
        .from('entities')
        .select('*', { count: 'exact', head: true });

      // If no entities exist, initialize with dummy data
      if (count === 0) {
        setIsInitializing(true);
        
        // Load all domains
        const domains = ['healthcare', 'agriculture', 'finance', 'technology'];
        for (const domain of domains) {
          await supabase.functions.invoke('generate-dummy-data', {
            body: { domain }
          });
        }
        
        setIsInitializing(false);
      }
    } catch (error) {
      console.log("Data initialization:", error);
      setIsInitializing(false);
    }
  };

  if (!isInitializing) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-xl border border-border shadow-[var(--shadow-card)] text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h3 className="text-xl font-semibold">Initializing Platform</h3>
        <p className="text-muted-foreground">Loading demo datasets...</p>
      </div>
    </div>
  );
};
