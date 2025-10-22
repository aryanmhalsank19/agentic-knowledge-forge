import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowDown } from "lucide-react";
import { useState } from "react";

const demoSteps = [
  {
    step: 1,
    title: "Login with Demo Account",
    description: "Use demo@example.com / demo123456 or click 'Try Demo Login'",
    complete: true,
  },
  {
    step: 2,
    title: "Load a Dataset",
    description: "Scroll down and click any 'Load Dataset' button (Healthcare, Finance, etc.)",
    complete: false,
  },
  {
    step: 3,
    title: "Explore Knowledge Graph",
    description: "View the interactive graph showing entities and relationships",
    complete: false,
  },
  {
    step: 4,
    title: "Ask Questions",
    description: "Type queries like 'What treats diabetes?' or 'How does irrigation work?'",
    complete: false,
  },
  {
    step: 5,
    title: "See AI Magic",
    description: "Observe confidence scores, caching, and hallucination reduction in action",
    complete: false,
  },
];

export const DemoGuide = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md animate-fade-in">
      <Card className="bg-card/95 backdrop-blur-lg border-2 border-primary/30 shadow-[var(--shadow-glow)]">
        <div 
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <h3 className="font-semibold text-lg">Quick Demo Guide</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            5 Steps
          </Badge>
        </div>
        
        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Follow these steps to explore the platform:
            </p>
            
            {demoSteps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.complete 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.complete ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.step}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-4 flex items-center justify-center gap-2 text-primary animate-bounce">
              <ArrowDown className="w-4 h-4" />
              <span className="text-xs font-medium">Scroll down to start</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};