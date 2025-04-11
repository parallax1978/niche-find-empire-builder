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
    // Get data from SerpAPI
    if (!SERPAPI_API_KEY) {
      throw new Error('SERPAPI_API_KEY environment variable is not set')
    }

    console.log('Getting data from SerpAPI...')
    const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&api_key=${SERPAPI_API_KEY}&google_domain=google.com&gl=us`
    
    const serpResponse = await fetch(serpUrl)
    
    if (!serpResponse.ok) {
      throw new Error(`SerpAPI error (${serpResponse.status}): ${await serpResponse.text()}`)
    }
    
    const serpData = await serpResponse.json()
    console.log('SerpAPI response received')
    
    // Extract search volume and CPC from SerpAPI data
    let searchVolume = 0
    let cpc = 0

    // Estimate search volume based on ads count
    if (serpData.ads && serpData.ads.length > 0) {
      searchVolume = Math.min(10000 + (serpData.ads.length * 1000), 100000)
    }

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
      }
    }
    
    // If no CPC from shopping, use ads-based estimate
    if (cpc === 0 && serpData.ads && serpData.ads.length > 0) {
      cpc = Math.min(5 + (serpData.ads.length * 0.5), 20)
    }

    // Set up the Moz API request
    const mozUrl = 'https://api.moz.com/v2/usage_data'
    const mozBody = JSON.stringify({
      usage_action: 'data.keyword.metrics.fetch',
      keywords: [keyword]
    })
    
    console.log('Sending request to Moz API...')
    const mozResponse = await fetch(mozUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOZ_API_KEY}`,
        'User-Agent': 'Mozilla/5.0'
      },
      body: mozBody
    })
    
    if (!mozResponse.ok) {
      throw new Error(`Moz API error (${mozResponse.status}): ${await mozResponse.text()}`)
    }
    
    const mozData = await mozResponse.json()
    console.log('Moz API response received')
    
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
    
    return new Response(
      JSON.stringify({
        keyword,
        searchVolume: 0,
        cpc: 0,
        errorMessage: `Failed to get data: ${error.message}`
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})
