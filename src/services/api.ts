
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

// Search for niches based on the provided criteria
export const searchNiches = async (criteria: SearchCriteria): Promise<KeywordResult[]> => {
  try {
    console.log("Searching with criteria:", JSON.stringify(criteria, null, 2));
    
    // Get real city data if a specific city wasn't selected
    const cities = criteria.city ? [criteria.city] : await fetchCities();
    
    // Get real niche data if a specific niche wasn't selected
    const niches = criteria.niche ? [criteria.niche] : await fetchNiches();
    
    const results: KeywordResult[] = [];
    
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
        
        // Generate random search volume and CPC values for demonstration
        const searchVolume = Math.floor(Math.random() * 900000) + 100000;
        const cpc = Math.random() * 49 + 1;
        
        // Skip if doesn't meet search volume or CPC criteria
        if (searchVolume < criteria.searchVolume.min || 
            searchVolume > criteria.searchVolume.max ||
            cpc < criteria.cpc.min || 
            cpc > criteria.cpc.max) {
          continue;
        }
        
        const fullKeyword = `${niche.name.toLowerCase()} ${city.name}`;
        const exactMatchDomain = `${niche.name.toLowerCase()}${city.name.toLowerCase().replace(/\s+/g, '')}.com`;
        const domainAvailable = Math.random() > 0.7; // 30% chance domain is available
        
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
      }
    }
    
    console.log(`Generated ${results.length} results after applying all filters`);
    
    return results;
  } catch (error) {
    console.error("Error searching niches:", error);
    throw error; // Propagate the error instead of returning an empty array
  }
};
