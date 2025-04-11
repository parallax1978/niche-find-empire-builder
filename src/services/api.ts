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
    throw error;
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
    throw error;
  }
};

// Fetch keyword data from our edge function
const fetchKeywordData = async (keyword: string): Promise<{ searchVolume: number, cpc: number, errorMessage?: string }> => {
  try {
    console.log(`Fetching data for keyword: ${keyword}`);
    
    const response = await fetch(`https://orbxoshntxwspdzokcdi.supabase.co/functions/v1/get-keyword-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYnhvc2hudHh3c3Bkem9rY2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTAzMDYsImV4cCI6MjA1OTk2NjMwNn0.6F89Z4dkoUHafH0QAgu35ayeNE9_A9PQ6XaaV04zi-U`
      },
      body: JSON.stringify({ keyword }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching keyword data (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch keyword data: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Received data for keyword "${keyword}":`, data);
    
    if (data.error) {
      console.error(`API reported error for "${keyword}":`, data.error);
      throw new Error(`API error: ${data.error}`);
    }
    
    return {
      searchVolume: data.searchVolume,
      cpc: data.cpc,
      errorMessage: data.errorMessage
    };
  } catch (error) {
    console.error(`Error fetching keyword data for "${keyword}":`, error);
    throw error;
  }
};

// Search for niches based on the provided criteria
export const searchNiches = async (criteria: SearchCriteria): Promise<KeywordResult[]> => {
  try {
    console.log("Searching with criteria:", JSON.stringify(criteria, null, 2));
    
    // Get cities data
    const cities = criteria.city ? [criteria.city] : await fetchCities();
    
    // Get niches data
    const niches = criteria.niche ? [criteria.niche] : await fetchNiches();
    
    // Filter cities by population if needed
    const filteredCities = criteria.population 
      ? cities.filter(city => {
          const min = criteria.population!.min || 0;
          const max = criteria.population!.max || Number.MAX_SAFE_INTEGER;
          return city.population >= min && city.population <= max;
        })
      : cities;
      
    console.log(`Processing ${niches.length} niches and ${filteredCities.length} cities`);
    
    const results: KeywordResult[] = [];
    
    // Limit combinations to avoid overloading
    const maxCombinations = criteria.city || criteria.niche ? 10 : 3;
    const selectedCities = criteria.city ? [criteria.city] : filteredCities.slice(0, maxCombinations);
    const selectedNiches = criteria.niche ? [criteria.niche] : niches.slice(0, maxCombinations);
    
    // Process combinations
    for (const niche of selectedNiches) {
      for (const city of selectedCities) {
        // Skip if we've reached the limit
        if (results.length >= maxCombinations && !criteria.city && !criteria.niche) {
          break;
        }
        
        // Generate the full keyword for searching
        const fullKeyword = `${niche.name.toLowerCase()} ${city.name}`;
        
        // Create exactMatchDomain
        const exactMatchDomain = `${niche.name.toLowerCase().replace(/\s+/g, '')}${city.name.toLowerCase().replace(/\s+/g, '')}.com`;
        
        try {
          // Get real data for this keyword
          const { searchVolume, cpc } = await fetchKeywordData(fullKeyword);
          
          // Skip if doesn't meet criteria
          if (searchVolume < criteria.searchVolume.min || 
              searchVolume > criteria.searchVolume.max ||
              cpc < criteria.cpc.min || 
              cpc > criteria.cpc.max) {
            continue;
          }
          
          // Simple domain availability check (just for demo)
          const domainAvailable = Math.random() > 0.7; // 30% chance available
          
          results.push({
            id: crypto.randomUUID(),
            keyword: fullKeyword,
            searchVolume,
            cpc,
            population: city.population,
            domainAvailable,
            domainLink: domainAvailable ? `https://domains.google.com/registrar/search?searchTerm=${exactMatchDomain}` : null,
            exactMatchDomain
          });
        } catch (error) {
          console.error(`Error processing ${fullKeyword}:`, error);
          // Continue with next combination
        }
      }
    }
    
    console.log(`Generated ${results.length} results after applying all filters`);
    
    return results;
  } catch (error) {
    console.error("Error searching niches:", error);
    throw error;
  }
};
