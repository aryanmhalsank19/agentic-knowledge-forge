import { Button } from "@/components/ui/button";
import { ArrowRight, Network, Sparkles } from "lucide-react";

export const Hero = () => {
  const scrollToDemo = () => {
    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-50" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI & Knowledge Graphs</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-[image:var(--gradient-primary)] leading-tight">
            Agentic Graph RAG
          </h1>
          
          <p className="text-2xl md:text-3xl text-muted-foreground font-light max-w-3xl mx-auto">
            Transform documents into intelligent knowledge graphs with AI-powered retrieval
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From document ingestion to dynamic ontology generation, entity resolution, and advanced agentic retrieval — 
            experience the future of information processing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              onClick={scrollToDemo}
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-[var(--shadow-glow)] transition-all hover:scale-105"
            >
              Explore Platform <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-secondary text-secondary hover:bg-secondary/10 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
            >
              <Network className="mr-2 w-5 h-5" />
              View Documentation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Entities Extracted</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-secondary">5000+</div>
              <div className="text-sm text-muted-foreground">Relationships Mapped</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-accent">4</div>
              <div className="text-sm text-muted-foreground">Domain Ontologies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
