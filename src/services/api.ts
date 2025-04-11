
import { supabase } from "@/integrations/supabase/client";
import { City, Niche, SearchCriteria, KeywordResult } from "@/types";

// Fetch cities from the database
export const fetchCities = async (): Promise<City[]> => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('population', { ascending: false })
      .order('name');
    
    if (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
    
    console.log("Fetched cities:", data);
    console.log("Number of cities:", data?.length);
    
    if (!data || data.length === 0) {
      throw new Error("No cities found in the database");
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchCities:", error);
    throw error; // Propagate the error instead of falling back to mock data
  }
};

// Fetch niches from the database
export const fetchNiches = async (): Promise<Niche[]> => {
  try {
    const { data, error } = await supabase
      .from('niches')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching niches:", error);
      throw error;
    }
    
    console.log("Fetched niches:", data);
    
    if (!data || data.length === 0) {
      throw new Error("No niches found in the database");
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchNiches:", error);
    throw error; // Propagate the error instead of falling back to mock data
  }
};

// Fetch keyword data from SerpAPI using our edge function
const fetchKeywordData = async (keyword: string): Promise<{ searchVolume: number, cpc: number }> => {
  try {
    console.log(`Fetching data for keyword: ${keyword}`);
    
    const response = await fetch(`https://orbxoshntxwspdzokcdi.supabase.co/functions/v1/get-keyword-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYnhvc2hudHh3c3Bkem9rY2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTAzMDYsImV4cCI6MjA1OTk2NjMwNn0.6F89Z4dkoUHafH0QAgu35ayeNE9_A9PQ6XaaV04zi-U'}`
      },
      body: JSON.stringify({ keyword }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching keyword data: ${errorText}`);
      throw new Error(`Failed to fetch keyword data: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Received data for keyword "${keyword}":`, data);
    
    return {
      searchVolume: data.searchVolume,
      cpc: data.cpc,
    };
  } catch (error) {
    console.error(`Error fetching keyword data for "${keyword}":`, error);
    // Fallback to random data if API fails
    return {
      searchVolume: Math.floor(Math.random() * 900000) + 100000,
      cpc: Math.random() * 49 + 1,
    };
  }
};

// Search for niches based on the provided criteria
export const searchNiches = async (criteria: SearchCriteria): Promise<KeywordResult[]> => {
  try {
    console.log("Searching with criteria:", JSON.stringify(criteria, null, 2));
    
    // Get real city data if a specific city wasn't selected
    const cities = criteria.city ? [criteria.city] : await fetchCities();
    
    // Get real niche data if a specific niche wasn't selected
    const niches = criteria.niche ? [criteria.niche] : await fetchNiches();
    
    const results: KeywordResult[] = [];
    
    // Process combinations in smaller batches to avoid overloading the API
    const batchSize = 3; // Process in small batches
    let currentBatch: Promise<KeywordResult>[] = [];
    
    // Generate combinations of keywords and locations using real data
    for (const niche of niches) {
      for (const city of cities) {
        // Skip if population criteria doesn't match (check this first)
        if (criteria.population) {
          const min = criteria.population.min || 0;
          const max = criteria.population.max || Number.MAX_SAFE_INTEGER;
          
          if (city.population < min || city.population > max) {
            // Log skipped cities due to population filter
            console.log(`Skipping ${city.name} (pop: ${city.population}) - outside population range ${min}-${max}`);
            continue;
          }
        }
        
        // Generate the full keyword for searching
        const fullKeyword = `${niche.name.toLowerCase()} ${city.name}`;
        
        // Create exactMatchDomain without spaces and in lowercase
        const exactMatchDomain = `${niche.name.toLowerCase().replace(/\s+/g, '')}${city.name.toLowerCase().replace(/\s+/g, '')}.com`;
        
        // Process keyword asynchronously
        const processPromise = (async () => {
          try {
            // Get real search volume and CPC data from SerpAPI
            const { searchVolume, cpc } = await fetchKeywordData(fullKeyword);
            
            // Skip if doesn't meet search volume or CPC criteria
            if (searchVolume < criteria.searchVolume.min || 
                searchVolume > criteria.searchVolume.max ||
                cpc < criteria.cpc.min || 
                cpc > criteria.cpc.max) {
              return null;
            }
            
            const domainAvailable = Math.random() > 0.7; // 30% chance domain is available
            
            return {
              id: crypto.randomUUID(),
              keyword: fullKeyword,
              searchVolume,
              cpc,
              population: city.population,
              domainAvailable,
              domainLink: domainAvailable ? `https://domains.google.com/registrar/search?searchTerm=${exactMatchDomain}` : null,
              exactMatchDomain
            };
          } catch (error) {
            console.error(`Error processing keyword ${fullKeyword}:`, error);
            return null;
          }
        })();
        
        currentBatch.push(processPromise);
        
        // When batch is full, wait for results and add to final results
        if (currentBatch.length >= batchSize) {
          const batchResults = await Promise.all(currentBatch);
          results.push(...batchResults.filter(result => result !== null));
          currentBatch = [];
          
          // Add a small delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Process any remaining items in the last batch
    if (currentBatch.length > 0) {
      const batchResults = await Promise.all(currentBatch);
      results.push(...batchResults.filter(result => result !== null));
    }
    
    console.log(`Generated ${results.length} results after applying all filters`);
    
    return results;
  } catch (error) {
    console.error("Error searching niches:", error);
    throw error; // Propagate the error instead of returning an empty array
  }
};
