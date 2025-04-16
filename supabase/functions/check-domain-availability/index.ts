
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
    const apiKey = Deno.env.get('NAMECHEAP_API_KEY');
    const username = Deno.env.get('NAMECHEAP_USERNAME');
    const clientIp = Deno.env.get('NAMECHEAP_CLIENT_IP');

    if (!apiKey || !username || !clientIp) {
      console.error('Missing required Namecheap API credentials', { 
        hasApiKey: !!apiKey, 
        hasUsername: !!username,
        hasClientIp: !!clientIp 
      });
      
      return new Response(
        JSON.stringify({ 
          error: true,
          errorMessage: 'Missing required Namecheap API credentials. Please check your Supabase secrets.'
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

    // Extract SLD (second-level domain) and TLD (top-level domain)
    const domainParts = domain.split('.');
    let sld, tld;
    
    if (domainParts.length >= 2) {
      sld = domainParts.slice(0, -1).join('.');
      tld = domainParts[domainParts.length - 1];
    } else {
      // Default to .com if no TLD specified
      sld = domain;
      tld = 'com';
    }

    // Build Namecheap API URL with the correct client IP
    const apiUrl = new URL('https://api.namecheap.com/xml.response');
    const params = {
      ApiUser: username,
      ApiKey: apiKey,
      UserName: username,
      ClientIp: clientIp,
      Command: 'namecheap.domains.check',
      SLD: sld,
      TLD: tld
    };
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value.toString());
    });

    // Log the API URL with sensitive parts masked
    const debugApiUrl = apiUrl.toString().replace(apiKey, 'API_KEY_MASKED');
    console.log(`Calling Namecheap API: ${debugApiUrl}`);

    // Call Namecheap API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl.toString(), {
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
          errorMessage: `Namecheap API error: ${response.status} - ${errorText.substring(0, 100)}`
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const xmlText = await response.text();
    console.log(`Response body length: ${xmlText.length}`);
    
    // Log a snippet of the response for debugging
    const responsePreview = xmlText.substring(0, 500) + (xmlText.length > 500 ? '...' : '');
    console.log(`Response preview: ${responsePreview}`);
    
    // Check for API errors using regex
    const errorMatch = xmlText.match(/<Error Number="([^"]+)">([^<]+)<\/Error>/);
    
    if (errorMatch) {
      const errorNumber = errorMatch[1];
      const errorMessage = errorMatch[2];
      
      console.error(`API error: ${errorNumber} - ${errorMessage}`);
      
      return new Response(
        JSON.stringify({ 
          error: true,
          available: false,
          errorMessage: `Namecheap API error: ${errorMessage}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract domain availability information using regex
    const availabilityMatch = xmlText.match(/<DomainCheckResult Domain="[^"]+" Available="([^"]+)"/);
    
    if (!availabilityMatch) {
      console.error("Unable to parse domain check result from API response");
      
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
    
    const available = availabilityMatch[1].toLowerCase() === "true";
    
    // Extract premium domain information if available
    const isPremiumMatch = xmlText.match(/IsPremiumName="([^"]+)"/);
    const premiumDomain = isPremiumMatch ? isPremiumMatch[1].toLowerCase() === "true" : false;
    
    // Extract premium pricing if available
    const premiumPriceMatch = xmlText.match(/PremiumRegistrationPrice="([^"]+)"/);
    const purchasePrice = premiumPriceMatch ? premiumPriceMatch[1] : null;
    
    const renewalPriceMatch = xmlText.match(/PremiumRenewalPrice="([^"]+)"/);
    const renewalPrice = renewalPriceMatch ? renewalPriceMatch[1] : null;
    
    const result = {
      domain: `${sld}.${tld}`,
      available,
      premiumDomain,
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
