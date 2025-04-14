
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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
      ClientIp: clientIp,
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

    // Parse XML response
    const xmlText = await response.text();
    console.log(`API Response: ${xmlText}`);
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for API errors
    const errorElements = xmlDoc?.querySelector("Errors");
    if (errorElements && errorElements.children.length > 0) {
      const errors = Array.from(errorElements.children).map(error => ({
        number: error.getAttribute("Number"),
        message: error.textContent
      }));
      
      console.error("Namecheap API errors:", errors);
      
      return new Response(
        JSON.stringify({ 
          error: 'Namecheap API returned errors',
          details: errors
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract domain availability information
    const domainCheckResult = xmlDoc?.querySelector("DomainCheckResult");
    
    if (!domainCheckResult) {
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
    
    const available = domainCheckResult.getAttribute("Available") === "true";
    const errorCode = domainCheckResult.getAttribute("ErrorNo") || null;
    
    const result = {
      domain: `${sld}.${tld}`,
      available,
      errorCode,
      premiumDomain: domainCheckResult.getAttribute("IsPremiumName") === "true" || false,
      purchasePrice: domainCheckResult.getAttribute("PremiumRegistrationPrice") || null,
      renewalPrice: domainCheckResult.getAttribute("PremiumRenewalPrice") || null,
      transferPrice: domainCheckResult.getAttribute("PremiumTransferPrice") || null,
      restorePrice: domainCheckResult.getAttribute("PremiumRestorePrice") || null,
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
