import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const dummyDatasets = [
  {
    domain: "healthcare",
    title: "Medical Research Papers",
    description: "Research papers on diabetes, treatments, and patient outcomes",
    entityCount: 150,
    relationshipCount: 420,
  },
  {
    domain: "agriculture",
    title: "Agricultural Reports",
    description: "Crop yields, fertilizer effectiveness, and farming techniques",
    entityCount: 120,
    relationshipCount: 350,
  },
  {
    domain: "finance",
    title: "Financial Policy Briefs",
    description: "Banking policies, interest rates, and economic indicators",
    entityCount: 95,
    relationshipCount: 280,
  },
  {
    domain: "technology",
    title: "Product Manuals",
    description: "Technical specifications, components, and supplier relationships",
    entityCount: 180,
    relationshipCount: 520,
  },
];

export const DummyDataManager = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const loadDummyData = async (domain: string) => {
    setLoading(domain);
    try {
      // Call backend function to generate and load dummy data
      const { data, error } = await supabase.functions.invoke('generate-dummy-data', {
        body: { domain }
      });

      if (error) throw error;

      toast.success(`Successfully loaded ${domain} dataset!`);
    } catch (error) {
      console.error("Error loading dummy data:", error);
      toast.error("Failed to load dummy data");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">
            Demo <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Datasets</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Load realistic dummy data across multiple domains to explore the platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {dummyDatasets.map((dataset) => (
            <Card key={dataset.domain} className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{dataset.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{dataset.description}</p>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="w-4 h-4 text-primary" />
                      <span>{dataset.entityCount} entities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{dataset.relationshipCount} relations</Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => loadDummyData(dataset.domain)}
                    disabled={loading !== null}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {loading === dataset.domain ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load Dataset"
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
