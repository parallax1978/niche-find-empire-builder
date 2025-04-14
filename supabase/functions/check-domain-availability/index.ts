
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Log incoming request details
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Try to get client IP from different possible headers
  const clientIps = [
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-real-ip'),
    req.headers.get('client-ip'),
    req.headers.get('X-Forwarded-For'),
    req.headers.get('X-Real-IP')
  ].filter(ip => ip !== null);

  console.log('Detected Client IPs:', clientIps);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API credentials from Supabase secrets
    const apiKey = Deno.env.get('NAMECHEAP_API_KEY');
    const clientIp = Deno.env.get('NAMECHEAP_CLIENT_IP');

    if (!apiKey || !clientIp) {
      console.error('Missing required Namecheap API credentials');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Missing API credentials',
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body to get the domain to check
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain parameter is required' }),
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

    // Build Namecheap API URL
    const apiUrl = new URL('https://api.namecheap.com/xml.response');
    const params = {
      ApiUser: 'apiuser', // Using your regular account username
      ApiKey: apiKey,
      UserName: 'apiuser', // Using your regular account username
      ClientIp: clientIp,
      Command: 'namecheap.domains.check',
      SLD: sld,
      TLD: tld
    };
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value.toString());
    });

    console.log(`Calling Namecheap API: ${apiUrl}`);

    // Call Namecheap API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      console.error(`Error from Namecheap API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check domain availability',
          details: `API returned ${response.status}: ${response.statusText}`
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse XML response using regex instead of DOMParser
    const xmlText = await response.text();
    console.log(`API Response: ${xmlText}`);
    
    // Check for API errors using regex
    const errorMatch = xmlText.match(/<Error Number="([^"]+)">([^<]+)<\/Error>/);
    if (errorMatch) {
      const errorNumber = errorMatch[1];
      const errorMessage = errorMatch[2];
      
      console.error(`Namecheap API error: ${errorNumber} - ${errorMessage}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Namecheap API returned an error',
          details: { errorNumber, errorMessage }
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
          error: 'Could not parse domain availability from API response',
          rawResponse: xmlText
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
    
    const transferPriceMatch = xmlText.match(/PremiumTransferPrice="([^"]+)"/);
    const transferPrice = transferPriceMatch ? transferPriceMatch[1] : null;
    
    const restorePriceMatch = xmlText.match(/PremiumRestorePrice="([^"]+)"/);
    const restorePrice = restorePriceMatch ? restorePriceMatch[1] : null;
    
    const result = {
      domain: `${sld}.${tld}`,
      available,
      premiumDomain,
      purchasePrice,
      renewalPrice,
      transferPrice,
      restorePrice,
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
        error: 'Server error when checking domain availability',
        message: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
