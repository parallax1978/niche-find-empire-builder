
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API credentials from Supabase secrets
    const apiKey = Deno.env.get('GODADDY_API_KEY');
    const apiSecret = Deno.env.get('GODADDY_API_SECRET');

    console.log(`Using GoDaddy API for domain availability check`);

    if (!apiKey || !apiSecret) {
      console.error('Missing required GoDaddy API credentials', { 
        hasApiKey: !!apiKey, 
        hasApiSecret: !!apiSecret
      });
      
      return new Response(
        JSON.stringify({ 
          error: true,
          errorMessage: 'Missing required GoDaddy API credentials. Please check your Supabase secrets.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body to get the domain to check
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ 
          error: true,
          errorMessage: 'Domain parameter is required'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Checking availability for domain: ${domain}`);

    // Build GoDaddy API URL - for checking single domain
    const apiUrl = `https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`;
    
    console.log(`Calling GoDaddy API: ${apiUrl}`);

    // Call GoDaddy API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    // Log detailed response information for troubleshooting
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers: ${JSON.stringify([...response.headers.entries()])}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error: ${response.status} - ${errorText.substring(0, 500)}`);
      
      return new Response(
        JSON.stringify({ 
          error: true,
          available: false,
          errorMessage: `GoDaddy API error: ${response.status} - ${errorText.substring(0, 100)}`
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    console.log(`Response data: ${JSON.stringify(data)}`);
    
    // Extract domain availability information from JSON response
    // GoDaddy API returns an object with available, domain, and price properties
    if (!data || typeof data !== 'object') {
      console.error("Invalid response format from GoDaddy API");
      
      return new Response(
        JSON.stringify({ 
          error: true,
          available: false,
          errorMessage: "Failed to parse domain availability from API response"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const available = !!data.available;
    
    // GoDaddy uses a "price" property for all domains
    // Premium domains will have a higher price but aren't explicitly marked as premium
    const isPremium = data.price && data.price > 15; // Assuming domains over $15 are premium
    const purchasePrice = data.price ? data.price.toString() : null;
    
    // GoDaddy doesn't provide renewal price in the availability check
    // We'll use the same purchase price or null for renewal
    const renewalPrice = purchasePrice;
    
    // Extract TLD from domain for consistent response format
    const domainParts = domain.split('.');
    const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : 'com';
    
    const result = {
      domain: domain,
      available,
      premiumDomain: isPremium,
      purchasePrice,
      renewalPrice,
      error: false
    };
    
    console.log(`Domain availability result:`, result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in check-domain-availability function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: true,
        available: false,
        errorMessage: `Unexpected error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
