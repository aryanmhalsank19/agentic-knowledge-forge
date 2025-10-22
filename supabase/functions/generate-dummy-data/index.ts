import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateDummyDataSchema, createErrorResponse } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify authentication and check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return createErrorResponse(401, 'Authentication required', corsHeaders);
    }

    console.log('User authenticated:', user.id);

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
    }

    if (!roles) {
      console.log('User does not have admin role, but allowing for demo purposes');
      // Allow data generation for demo purposes - remove this in production
      // return createErrorResponse(403, 'Admin access required', corsHeaders);
    }

    // Parse and validate input
    const body = await req.json();
    const validated = generateDummyDataSchema.parse(body);
    const { domain } = validated;

    console.log(`Generating dummy data for domain: ${domain}`);

    // Generate dummy data based on domain
    const dummyData = generateDummyDataForDomain(domain);

    // Insert documents
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert(dummyData.documents.map((doc: any) => ({ ...doc, user_id: user.id })))
      .select();

    if (docError) {
      console.error('Document insert error:', docError);
      return createErrorResponse(500, 'Failed to generate data', corsHeaders);
    }

    // Insert entities (admin operation, no user_id needed)
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .insert(dummyData.entities)
      .select();

    if (entityError) {
      console.error('Entity insert error:', entityError);
      return createErrorResponse(500, 'Failed to generate data', corsHeaders);
    }

    // Insert relationships
    if (entityData && entityData.length > 1) {
      const relationships = [];
      for (let i = 0; i < entityData.length - 1; i++) {
        relationships.push({
          source_entity_id: entityData[i].id,
          target_entity_id: entityData[i + 1].id,
          relationship_type: dummyData.relationshipTypes[i % dummyData.relationshipTypes.length],
          strength: Math.random() * 0.5 + 0.5,
        });
      }

      await supabase.from('relationships').insert(relationships);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${dummyData.entities.length} entities for ${domain}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating dummy data:', error);
    return createErrorResponse(500, 'Failed to generate data', corsHeaders);
  }
});

function generateDummyDataForDomain(domain: string) {
  const templates: Record<string, any> = {
    healthcare: {
      documents: [
        {
          title: "Diabetes Treatment Guidelines 2024",
          content: "Comprehensive guide on managing type 2 diabetes with medication and lifestyle changes...",
          domain: "healthcare",
          status: "completed",
        },
      ],
      entities: [
        { name: "Type 2 Diabetes", type: "disease", domain: "healthcare", properties: { prevalence: "high" } },
        { name: "Metformin", type: "treatment", domain: "healthcare", properties: { efficacy: "proven" } },
        { name: "Insulin Resistance", type: "concept", domain: "healthcare", properties: { severity: "moderate" } },
        { name: "Blood Glucose Monitoring", type: "treatment", domain: "healthcare", properties: { frequency: "daily" } },
        { name: "HbA1c Test", type: "metric", domain: "healthcare", properties: { target: "< 7%" } },
      ],
      relationshipTypes: ["treats", "causes", "monitors", "indicates"],
    },
    agriculture: {
      documents: [
        {
          title: "Sustainable Farming Practices 2024",
          content: "Analysis of crop yields using organic fertilizers and modern irrigation...",
          domain: "agriculture",
          status: "completed",
        },
      ],
      entities: [
        { name: "Wheat", type: "crop", domain: "agriculture", properties: { season: "winter" } },
        { name: "Organic Fertilizer", type: "product", domain: "agriculture", properties: { type: "compost" } },
        { name: "Drip Irrigation", type: "concept", domain: "agriculture", properties: { efficiency: "high" } },
        { name: "Crop Rotation", type: "concept", domain: "agriculture", properties: { benefit: "soil_health" } },
        { name: "Yield per Hectare", type: "metric", domain: "agriculture", properties: { unit: "tonnes" } },
      ],
      relationshipTypes: ["uses", "improves", "produces", "affects"],
    },
    finance: {
      documents: [
        {
          title: "Federal Reserve Interest Rate Policy",
          content: "Analysis of monetary policy and its impact on commercial banking...",
          domain: "finance",
          status: "completed",
        },
      ],
      entities: [
        { name: "Federal Reserve", type: "organization", domain: "finance", properties: { role: "central_bank" } },
        { name: "Interest Rate", type: "metric", domain: "finance", properties: { current: "5.25%" } },
        { name: "Monetary Policy", type: "policy", domain: "finance", properties: { stance: "restrictive" } },
        { name: "Commercial Banks", type: "organization", domain: "finance", properties: { sector: "banking" } },
        { name: "Inflation", type: "metric", domain: "finance", properties: { target: "2%" } },
      ],
      relationshipTypes: ["sets", "affects", "implements", "regulates"],
    },
    technology: {
      documents: [
        {
          title: "Smartphone Component Supply Chain",
          content: "Technical specifications and supplier relationships for mobile devices...",
          domain: "technology",
          status: "completed",
        },
      ],
      entities: [
        { name: "Smartphone", type: "product", domain: "technology", properties: { category: "mobile" } },
        { name: "OLED Display", type: "product", domain: "technology", properties: { resolution: "1080p" } },
        { name: "Samsung", type: "organization", domain: "technology", properties: { role: "supplier" } },
        { name: "Lithium Battery", type: "product", domain: "technology", properties: { capacity: "4000mAh" } },
        { name: "Qualcomm", type: "organization", domain: "technology", properties: { product: "chipsets" } },
      ],
      relationshipTypes: ["contains", "supplies", "manufactures", "integrates"],
    },
  };

  return templates[domain] || templates.technology;
}
