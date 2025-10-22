import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, GitBranch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const queryExamples = [
  { text: "What treatments are available for diabetes?", type: "vector" },
  { text: "Show me the relationship between crops and fertilizers", type: "graph" },
  { text: "Which policies affect interest rates?", type: "hybrid" },
];

export const QueryInterface = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<"vector" | "graph" | "hybrid">("hybrid");

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setIsLoading(true);
    try {
      // Call the process-query edge function
      const { data, error } = await supabase.functions.invoke('process-query', {
        body: { 
          query: query.trim(),
          domain: searchType,
          useCache: true 
        }
      });

      if (error) {
        console.error("Query error:", error);
        toast.error("Failed to process query. Please try again.");
        return;
      }

      toast.success(`Query processed using ${searchType} search`);
      
      // Display AI response
      setResults([
        { 
          entity: "AI Response", 
          relevance: data.confidence || 0.85, 
          type: "answer",
          response: data.response,
          cached: data.cached
        }
      ]);
    } catch (error) {
      console.error("Query error:", error);
      toast.error("Failed to process query");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="demo" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 backdrop-blur-sm border border-accent/30 rounded-full mb-4">
            <span className="text-sm font-semibold text-accent">Step 4</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            AI Query <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Interface</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ask questions and get intelligent answers powered by your knowledge graph
          </p>
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-sm text-muted-foreground px-4 py-3 bg-muted/30 rounded-lg border border-border">
              🤖 <strong>Hallucination Reduction:</strong> Every answer includes a confidence score (0-100%). 
              Low-confidence responses are automatically re-prompted for better accuracy!
            </p>
            <p className="text-sm text-primary font-medium">
              Try asking: "What treats Type 2 Diabetes?" or "How does drip irrigation improve farming?"
            </p>
          </div>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Search type selector */}
            <div className="flex gap-3 flex-wrap">
              <Button
                variant={searchType === "vector" ? "default" : "outline"}
                onClick={() => setSearchType("vector")}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                Vector Search
              </Button>
              <Button
                variant={searchType === "graph" ? "default" : "outline"}
                onClick={() => setSearchType("graph")}
                className="gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Graph Traversal
              </Button>
              <Button
                variant={searchType === "hybrid" ? "default" : "outline"}
                onClick={() => setSearchType("hybrid")}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Hybrid
              </Button>
            </div>

            {/* Query input */}
            <div className="flex gap-3">
              <Input
                placeholder="Ask anything about your knowledge graph..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                className="flex-1 bg-background/50 border-border"
              />
              <Button 
                onClick={handleQuery} 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Processing..." : "Search"}
              </Button>
            </div>

            {/* Example queries */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Try these examples:</div>
              <div className="flex gap-2 flex-wrap">
                {queryExamples.map((example, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setQuery(example.text);
                      setSearchType(example.type as any);
                    }}
                  >
                    {example.text}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="font-semibold">Results:</div>
                {results.map((result, index) => (
                  <Card key={index} className="p-4 bg-background/50 border-border">
                    {result.type === "answer" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">AI Response</div>
                            {result.cached && (
                              <Badge variant="secondary" className="text-xs">Cached</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Confidence</div>
                            <div className="text-lg font-bold text-primary">
                              {(result.relevance * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {typeof result.response === 'string' 
                            ? result.response 
                            : JSON.stringify(result.response, null, 2)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{result.entity}</div>
                          <Badge variant="outline" className="mt-1">{result.type}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Relevance</div>
                          <div className="text-lg font-bold text-primary">
                            {(result.relevance * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};