
import { supabase } from "@/integrations/supabase/client";
import { City, Niche, SearchCriteria, KeywordResult } from "@/types";

// Fetch cities from the database
export const fetchCities = async (): Promise<City[]> => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
    
    console.log("Fetched cities:", data);
    console.log("Number of cities:", data?.length);
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchCities:", error);
    // Fallback to mock data in case of error
    return MOCK_CITIES;
  }
};

// Mock cities data for fallback
const MOCK_CITIES: City[] = [
  { id: 1, name: "New York", population: 8336817 },
  { id: 2, name: "Los Angeles", population: 3979576 },
  { id: 3, name: "Chicago", population: 2693976 },
  { id: 4, name: "Houston", population: 2320268 },
  { id: 5, name: "Phoenix", population: 1680992 }
];

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
    return data || [];
  } catch (error) {
    console.error("Error in fetchNiches:", error);
    // Fallback to mock data in case of error
    return MOCK_NICHES;
  }
};

// Mock niches data for fallback
const MOCK_NICHES: Niche[] = [
  { id: 1, name: "Plumber" },
  { id: 2, name: "Electrician" },
  { id: 3, name: "Dentist" },
  { id: 4, name: "Lawyer" },
  { id: 5, name: "Accountant" }
];

// Search for niches based on the provided criteria
export const searchNiches = async (criteria: SearchCriteria): Promise<KeywordResult[]> => {
  try {
    // Simulate an API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real application, this would be a call to your backend or a third-party API
    // For now, we'll generate some mock data based on the search criteria
    const results: KeywordResult[] = [];
    
    // Generate keywords based on niche and city if provided
    const baseKeywords = criteria.niche 
      ? [criteria.niche.name.toLowerCase()] 
      : ['plumber', 'electrician', 'lawyer', 'dentist', 'accountant'];
    
    const locations = criteria.city 
      ? [criteria.city.name] 
      : ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    
    // Generate combinations of keywords and locations
    for (const keyword of baseKeywords) {
      for (const location of locations) {
        // Only include results that match the criteria
        const searchVolume = Math.floor(Math.random() * 900000) + 100000;
        const cpc = Math.random() * 49 + 1;
        const population = criteria.city ? criteria.city.population : Math.floor(Math.random() * 8000000) + 100000;
        
        // Skip if doesn't meet criteria
        if (searchVolume < criteria.searchVolume.min || 
            searchVolume > criteria.searchVolume.max ||
            cpc < criteria.cpc.min || 
            cpc > criteria.cpc.max) {
          continue;
        }
        
        // Skip if population criteria doesn't match
        if (criteria.population && 
            (population < criteria.population.min || 
             population > criteria.population.max)) {
          continue;
        }
        
        const fullKeyword = `${keyword} ${location}`;
        const exactMatchDomain = `${keyword}${location.toLowerCase().replace(/\s+/g, '')}.com`;
        const domainAvailable = Math.random() > 0.7; // 30% chance domain is available
        
        results.push({
          id: crypto.randomUUID(),
          keyword: fullKeyword,
          searchVolume,
          cpc,
          population,
          domainAvailable,
          domainLink: domainAvailable ? `https://domains.google.com/registrar/search?searchTerm=${exactMatchDomain}` : null,
          exactMatchDomain
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error searching niches:", error);
    return [];
  }
};
