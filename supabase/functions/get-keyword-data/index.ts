import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MOZ_API_KEY = Deno.env.get('MOZ_API_KEY')
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY')

interface RequestBody {
  keyword: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Get keyword from request body
  const { keyword } = await req.json() as RequestBody

  if (!keyword) {
    return new Response(
      JSON.stringify({ error: 'Keyword is required' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }

  console.log(`Getting data for keyword: "${keyword}"`)
  
  try {
    // Step 1: Get data from Moz API first
    if (!MOZ_API_KEY) {
      throw new Error('MOZ_API_KEY environment variable is not set')
    }
    
    const [accessId, secret] = MOZ_API_KEY.split(':')
    
    if (!accessId || !secret) {
      throw new Error('MOZ_API_KEY must be in format access_id:secret')
    }
    
    // Encode credentials for basic auth
    const credentials = btoa(`${accessId}:${secret}`)
    
    // Set up the Moz API request
    const mozUrl = 'https://lsapi.seomoz.com/v2/keyword_metrics'
    const mozBody = JSON.stringify({
      keywords: [keyword]
    })
    
    console.log('Sending request to Moz API...')
    const mozResponse = await fetch(mozUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: mozBody
    })
    
    if (!mozResponse.ok) {
      const errorText = await mozResponse.text()
      console.error(`Moz API error (${mozResponse.status}): ${errorText}`)
      throw new Error(`Moz API returned status ${mozResponse.status}: ${errorText}`)
    }
    
    const mozData = await mozResponse.json()
    console.log('Moz API response:', JSON.stringify(mozData))
    
    if (!mozData || !mozData.results || mozData.results.length === 0) {
      throw new Error('No data returned from Moz API')
    }
    
    // Extract search volume and CPC from Moz data
    const keywordData = mozData.results[0]
    const searchVolume = keywordData.search_volume || 0
    let cpc = keywordData.cpc || 0
    
    // If Moz doesn't provide CPC, try to get it from SerpAPI
    if (cpc === 0 && SERPAPI_API_KEY) {
      try {
        console.log('Getting CPC from SerpAPI...')
        const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&api_key=${SERPAPI_API_KEY}&google_domain=google.com&gl=us`
        
        const serpResponse = await fetch(serpUrl)
        
        if (!serpResponse.ok) {
          throw new Error(`SerpAPI error (${serpResponse.status}): ${await serpResponse.text()}`)
        }
        
        const serpData = await serpResponse.json()
        console.log('SerpAPI response received')
        
        // Extract CPC from shopping data if available
        if (serpData.shopping_results && serpData.shopping_results.length > 0) {
          const prices = serpData.shopping_results
            .filter(item => item.price && typeof item.price === 'string')
            .map(item => {
              const priceMatch = item.price.match(/\$?(\d+(\.\d+)?)/);
              return priceMatch ? parseFloat(priceMatch[1]) : 0;
            })
            .filter(price => price > 0);
          
          if (prices.length > 0) {
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
            cpc = avgPrice * 0.05 // Estimate CPC as 5% of product price
            console.log(`Calculated CPC from shopping results: ${cpc.toFixed(2)}`)
          }
        }
        
        // If no CPC from shopping, use ads-based estimate
        if (cpc === 0 && serpData.ads && serpData.ads.length > 0) {
          cpc = Math.min(5 + (serpData.ads.length * 0.5), 20)
          console.log(`Calculated CPC from ads count: ${cpc.toFixed(2)}`)
        }
      } catch (serpError) {
        console.error(`Error fetching CPC from SerpAPI: ${serpError.message}`)
      }
    }
    
    // Return the data
    console.log(`Final data: keyword=${keyword}, searchVolume=${searchVolume}, cpc=${cpc}`)
    return new Response(
      JSON.stringify({
        keyword,
        searchVolume,
        cpc,
        errorMessage: null
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error(`Error fetching keyword data: ${error.message}`)
    
    // Instead of providing fake data, return an error response
    return new Response(
      JSON.stringify({
        keyword,
        searchVolume: 0,
        cpc: 0,
        errorMessage: `Failed to get data from Moz API: ${error.message}`
      }),
      { 
        status: 500, // Changed to 500 to indicate server error
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})
