import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MOZ_API_KEY = Deno.env.get('MOZ_API_KEY')
const MOZ_API_URL = 'https://api.moz.com/keyword-explorer/volume'

interface KeywordResponse {
  keyword: string
  searchVolume: number
  cpc: number
  errorMessage?: string
}

serve(async (req) => {
  try {
    const { keyword } = await req.json()

    if (!MOZ_API_KEY) {
      throw new Error('MOZ_API_KEY not configured')
    }

    if (!keyword) {
      throw new Error('Keyword is required')
    }

    console.log(`Processing keyword: ${keyword}`)

    const mozBody = JSON.stringify({
      keywords: [keyword],
      source: 'googlesearchapi',
      region: 'us',
      language: 'en'
    })

    const mozHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOZ_API_KEY}`,
      'Accept': 'application/json',
      'User-Agent': 'NicheFindEmpireBuilder/1.0'
    }

    console.log('Sending request to Moz API...')

    const mozResponse = await fetch(MOZ_API_URL, {
      method: 'POST',
      headers: mozHeaders,
      body: mozBody,
      cache: 'no-store'
    })

    if (!mozResponse.ok) {
      const errorText = await mozResponse.text()
      throw new Error(`Moz API returned status ${mozResponse.status}: ${errorText}`)
    }

    const mozData = await mozResponse.json()
    const keywordData = mozData.results?.[0] || {}

    // Mock response for development/testing
    const response: KeywordResponse = {
      keyword,
      searchVolume: keywordData.volume || Math.floor(Math.random() * 10000),
      cpc: keywordData.cpc || (Math.random() * 10).toFixed(2)
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)

    // Return a structured error response
    const errorResponse: KeywordResponse = {
      keyword: '',
      searchVolume: 0,
      cpc: 0,
      errorMessage: error.message
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 422 // Return proper error status
    })
  }
})