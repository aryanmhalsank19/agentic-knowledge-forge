import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Entity {
  id: string;
  name: string;
  type: string;
  domain: string;
}

interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
}

export const GraphVisualization = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      // Type cast to work around type generation timing
      const entitiesData = await (supabase as any)
        .from('entities')
        .select('*')
        .limit(50);
      
      const relationshipsData = await (supabase as any)
        .from('relationships')
        .select('*')
        .limit(100);

      if (entitiesData.data) setEntities(entitiesData.data);
      if (relationshipsData.data) setRelationships(relationshipsData.data);
    } catch (error) {
      console.log("Graph data loading...");
    }
  };

  const getEntityColor = (domain: string) => {
    const colors: Record<string, string> = {
      healthcare: 'hsl(var(--entity-health))',
      agriculture: 'hsl(var(--entity-agriculture))',
      finance: 'hsl(var(--entity-finance))',
      technology: 'hsl(var(--entity-tech))',
      general: 'hsl(var(--entity-general))',
    };
    return colors[domain] || colors.general;
  };

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 backdrop-blur-sm border border-secondary/30 rounded-full mb-4">
            <span className="text-sm font-semibold text-secondary">Step 3</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Knowledge <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Graph</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive visualization of extracted entities and their relationships
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto px-4 py-3 bg-muted/30 rounded-lg border border-border">
            🎨 <strong>Interactive:</strong> Each color represents a different domain. 
            Relationships show how entities connect (e.g., "Metformin" treats "Type 2 Diabetes").
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border">
          <div className="mb-6 flex gap-3 flex-wrap">
            <Badge className="bg-[hsl(var(--entity-health))] text-white">Healthcare</Badge>
            <Badge className="bg-[hsl(var(--entity-agriculture))] text-white">Agriculture</Badge>
            <Badge className="bg-[hsl(var(--entity-finance))] text-white">Finance</Badge>
            <Badge className="bg-[hsl(var(--entity-tech))] text-white">Technology</Badge>
          </div>

          <div className="relative h-[500px] bg-background/50 rounded-lg border border-border overflow-hidden">
            <svg className="w-full h-full">
              {/* Draw relationships as lines */}
              {relationships.map((rel) => {
                const sourceIdx = entities.findIndex(e => e.id === rel.source_entity_id);
                const targetIdx = entities.findIndex(e => e.id === rel.target_entity_id);
                if (sourceIdx === -1 || targetIdx === -1) return null;

                const sourceX = (sourceIdx % 10) * 80 + 40;
                const sourceY = Math.floor(sourceIdx / 10) * 80 + 40;
                const targetX = (targetIdx % 10) * 80 + 40;
                const targetY = Math.floor(targetIdx / 10) * 80 + 40;

                return (
                  <line
                    key={rel.id}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                );
              })}

              {/* Draw entities as nodes */}
              {entities.slice(0, 50).map((entity, index) => {
                const x = (index % 10) * 80 + 40;
                const y = Math.floor(index / 10) * 80 + 40;
                
                return (
                  <g key={entity.id} className="cursor-pointer hover:scale-110 transition-transform">
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill={getEntityColor(entity.domain)}
                      className="animate-graph-pulse"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    />
                    <title>{`${entity.name} (${entity.type})`}</title>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-border">
              <div className="text-sm font-semibold mb-2">Entity Types</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--entity-health))]" />
                  <span>Healthcare</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--entity-agriculture))]" />
                  <span>Agriculture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--entity-finance))]" />
                  <span>Finance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--entity-tech))]" />
                  <span>Technology</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{entities.length}</div>
              <div className="text-sm text-muted-foreground">Entities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{relationships.length}</div>
              <div className="text-sm text-muted-foreground">Relationships</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {new Set(entities.map(e => e.domain)).size}
              </div>
              <div className="text-sm text-muted-foreground">Domains</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
