import { Card } from "@/components/ui/card";
import { FileText, Brain, Network, Search, CheckCircle } from "lucide-react";

const pipelineStages = [
  {
    icon: FileText,
    title: "Document Parsing",
    description: "Extract text and structure from PDFs, DOCX, and more",
    status: "completed" as const,
  },
  {
    icon: Brain,
    title: "Ontology Extraction",
    description: "AI identifies entities and relationships using domain knowledge",
    status: "processing" as const,
  },
  {
    icon: Network,
    title: "Graph Construction",
    description: "Build interconnected knowledge graph with entity resolution",
    status: "pending" as const,
  },
  {
    icon: Search,
    title: "Retrieval Testing",
    description: "Query the graph with vector, graph, and hybrid search",
    status: "pending" as const,
  },
];

export const Pipeline = () => {
  return (
    <section className="py-20 relative" id="pipeline">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            The <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Pipeline</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From raw documents to intelligent retrieval in four seamless stages
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="relative">
                {index < pipelineStages.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
                )}
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 animate-fade-in relative overflow-hidden group">
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`p-3 rounded-xl ${
                      stage.status === 'completed' ? 'bg-primary/20 text-primary' :
                      stage.status === 'processing' ? 'bg-secondary/20 text-secondary animate-pulse-glow' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      <stage.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{stage.title}</h3>
                        {stage.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                        {stage.status === 'processing' && (
                          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                  {stage.status === 'processing' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent animate-pulse" />
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
