import { Card } from "@/components/ui/card";
import { Brain, GitBranch, Zap, Database, Target, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Extraction",
    description: "Advanced LLM models extract entities, relationships, and ontologies from any document type",
    color: "text-[hsl(var(--entity-health))]",
  },
  {
    icon: GitBranch,
    title: "Dynamic Ontology Generation",
    description: "Automatically generates domain-specific ontologies tailored to your document corpus",
    color: "text-[hsl(var(--entity-agriculture))]",
  },
  {
    icon: Database,
    title: "Entity Resolution",
    description: "Intelligent deduplication and merging of similar entities across documents",
    color: "text-[hsl(var(--entity-finance))]",
  },
  {
    icon: Target,
    title: "Multi-Modal Retrieval",
    description: "Combines vector search, graph traversal, and logical filtering for optimal results",
    color: "text-[hsl(var(--entity-tech))]",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Watch your knowledge graph grow in real-time as documents are processed",
    color: "text-primary",
  },
  {
    icon: Sparkles,
    title: "Interactive Visualization",
    description: "Explore your knowledge graph with smooth animations and intuitive interactions",
    color: "text-secondary",
  },
];

export const Features = () => {
  return (
    <section className="py-20 relative" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build intelligent knowledge graphs from unstructured data
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[var(--shadow-card)] animate-fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon className={`w-12 h-12 mb-4 ${feature.color} group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
