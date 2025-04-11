import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MOZ_API_KEY = Deno.env.get('MOZ_API_KEY')
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY')

interface RequestBody {
  keyword: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
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

    // Set up the Moz API request
    const mozUrl = 'https://moz.com/api/v2/keyword_explorer/metrics/domain'
    const mozBody = JSON.stringify({
      keywords: [keyword],
      provider: "us_google",
      metric_types: ["search_volume", "search_volume_monthly", "cpc"]
    })

    console.log('Sending request to Moz API...')
    console.log('Request body:', mozBody)

    // Log headers being sent (excluding sensitive data)
    const mozHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [REDACTED]'
    }
    console.log('Request headers:', JSON.stringify(mozHeaders, null, 2))

    try {
      const response = await fetch(mozUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOZ_API_KEY}`
        },
        body: mozBody
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Moz API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Moz API error:', error)
      throw error
    }
    console.log('Making Moz API request with body:', mozBody)

    // Log headers being sent
    const mozHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${MOZ_API_KEY}:`)}`,
    }
    console.log('Moz API Headers:', JSON.stringify(mozHeaders, null, 2))

    const mozResponse = await fetch(mozUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${MOZ_API_KEY}:`)}`,
        'Accept': 'application/json',
        'User-Agent': 'RankAndRentNicheFinder/1.0'
      },
      body: mozBody
    })

    let mozData;
    try {
      mozData = await mozResponse.json();
    } catch (e) {
      console.error('Failed to parse Moz API response:', e);
      throw new Error('Invalid JSON response from Moz API');
    }

    console.log('Moz API response:', JSON.stringify(mozData, null, 2));

    if (!mozResponse.ok) {
      console.error(`Moz API error (${mozResponse.status}):`, mozData);
      throw new Error(`Moz API returned status ${mozResponse.status}`);
    }

    if (!mozData || typeof mozData !== 'object') {
      throw new Error('Unexpected response format from Moz API');
    }
    

    if (!mozData || !mozData.data || mozData.data.length === 0) {
      throw new Error('No data returned from Moz API')
    }

    // Extract search volume and CPC from Moz data
    const keywordData = mozData.data[0]
    let searchVolume = keywordData.search_volume?.value || 0
    let cpc = keywordData.cpc?.value || 0

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

    return new Response(
      JSON.stringify({
        keyword,
        searchVolume: 0,
        cpc: 0,
        errorMessage: `Failed to get data from Moz API: ${error.message}`
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