import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pipeline } from "@/components/landing/Pipeline";
import { GraphVisualization } from "@/components/graph/GraphVisualization";
import { QueryInterface } from "@/components/query/QueryInterface";
import { DummyDataManager } from "@/components/data/DummyDataManager";
import { DummyDataInitializer } from "@/components/data/DummyDataInitializer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <DummyDataInitializer />
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
