
import { City, Niche, KeywordResult, SearchCriteria } from "../types";
import { supabase } from "@/integrations/supabase/client";

// Fetch cities from Supabase
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
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchCities:", error);
    // Fallback to mock data in case of error
    return MOCK_CITIES;
  }
};

// Fetch niches from Supabase
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
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchNiches:", error);
    // Fallback to mock data in case of error
    return MOCK_NICHES;
  }
};

// Mock data for fallback
const MOCK_CITIES: City[] = [
  { id: 1, name: "New York", population: 8804190 },
  { id: 2, name: "Los Angeles", population: 3898747 },
  { id: 3, name: "Chicago", population: 2746388 },
  { id: 4, name: "Houston", population: 2304580 },
  { id: 5, name: "Phoenix", population: 1608139 },
  { id: 6, name: "Philadelphia", population: 1603797 },
  { id: 7, name: "San Antonio", population: 1434625 },
  { id: 8, name: "San Diego", population: 1386932 },
  { id: 9, name: "Dallas", population: 1304379 },
  { id: 10, name: "San Jose", population: 1013240 },
];

// Mock data for fallback
const MOCK_NICHES: Niche[] = [
  { id: 1, name: "Plumber" },
  { id: 2, name: "Electrician" },
  { id: 3, name: "Lawyer" },
  { id: 4, name: "Dentist" },
  { id: 5, name: "Roofing" },
  { id: 6, name: "Pest Control" },
  { id: 7, name: "HVAC" },
  { id: 8, name: "Landscaping" },
  { id: 9, name: "House Cleaning" },
  { id: 10, name: "Moving Services" },
];

// Generate keyword variants based on available data
const generateKeywordVariants = (niche?: string, city?: string): string[] => {
  if (niche && city) {
    // Only generate city + niche or niche + city combinations
    return [
      `${city} ${niche}`,
      `${niche} ${city}`,
    ];
  } else if (niche) {
    // If only niche is provided, return generic combinations
    return getAllCities().map(city => [`${city} ${niche}`, `${niche} ${city}`]).flat();
  } else if (city) {
    // If only city is provided, return combinations with all niches
    return getAllNiches().map(niche => [`${city} ${niche}`, `${niche} ${city}`]).flat();
  } else {
    // If neither is provided, generate all possible combinations
    const allCombinations: string[] = [];
    const cities = getAllCities();
    const niches = getAllNiches();
    
    for (const city of cities) {
      for (const niche of niches) {
        allCombinations.push(`${city} ${niche}`);
        allCombinations.push(`${niche} ${city}`);
      }
    }
    
    return allCombinations;
  }
};

// Helper to get all city names
const getAllCities = (): string[] => {
  return MOCK_CITIES.map(city => city.name);
};

// Helper to get all niche names
const getAllNiches = (): string[] => {
  return MOCK_NICHES.map(niche => niche.name);
};

// Generate mock search data for a keyword
const generateMockSearchData = (keyword: string): { volume: number; cpc: number } => {
  // Generate realistic but random data
  const baseVolume = Math.floor(Math.random() * 1000) * 10;
  const baseCpc = (Math.random() * 10 + 1).toFixed(2);
  
  return {
    volume: baseVolume,
    cpc: parseFloat(baseCpc),
  };
};

// Format keyword for domain check by removing spaces and special characters
const formatForDomain = (keyword: string): string => {
  return keyword.toLowerCase()
    .replace(/\s+/g, "")        // Remove spaces
    .replace(/[^a-z0-9]/g, ""); // Remove special characters
};

// Mock domain availability check for EMD (Exact Match Domain)
const checkDomainAvailability = async (keyword: string): Promise<boolean> => {
  // In a real implementation, this would call the Namecheap API
  // Format keyword for domain name
  const domainName = formatForDomain(keyword);
  
  // We'll randomly determine availability for the mock
  // In reality, this would check if domainName.com is available
  return Math.random() > 0.5;
};

// Generate affiliate link for domain registration
const generateAffiliateLink = (keyword: string): string => {
  // In a real implementation, this would generate a proper Namecheap affiliate link
  // Format the domain name
  const domainName = formatForDomain(keyword);
  return `https://www.namecheap.com/domains/registration/results/?domain=${domainName}.com`;
};

// Search for keywords based on search criteria
export const searchNiches = async (criteria: SearchCriteria): Promise<KeywordResult[]> => {
  // Try to get results from Supabase first
  try {
    let query = supabase.from('keyword_results').select('*');
    
    // Apply filters if provided
    if (criteria.niche) {
      query = query.ilike('keyword', `%${criteria.niche.name}%`);
    }
    
    if (criteria.city) {
      query = query.or(`keyword.ilike.%${criteria.city.name}%`);
    }
    
    if (criteria.searchVolume) {
      query = query
        .gte('search_volume', criteria.searchVolume.min)
        .lte('search_volume', criteria.searchVolume.max);
    }
    
    if (criteria.cpc) {
      query = query
        .gte('cpc', criteria.cpc.min)
        .lte('cpc', criteria.cpc.max);
    }
    
    if (criteria.population && criteria.city) {
      // Note: population filtering is handled client-side since it's related to the city
      // This is a simplification, in a real app you might want a more sophisticated approach
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching keyword results:", error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Filter by population if criteria.population is provided
      let results = data;
      if (criteria.population && criteria.city) {
        if (criteria.city.population >= criteria.population.min && 
            criteria.city.population <= criteria.population.max) {
          results = data.filter(item => 
            item.keyword.includes(criteria.city!.name));
        } else {
          // If the selected city doesn't meet the population criteria
          results = [];
        }
      }
      
      // Transform Supabase data to match our KeywordResult interface
      return results.map(item => ({
        id: item.id,
        keyword: item.keyword,
        searchVolume: item.search_volume,
        cpc: item.cpc,
        population: item.population,
        domainAvailable: item.domain_available,
        domainLink: item.domain_link,
        exactMatchDomain: item.exact_match_domain
      }));
    }
  } catch (error) {
    console.error("Error searching Supabase:", error);
    // If there's an error or no results, fall back to the mock implementation
  }
  
  // Fall back to mock implementation
  return new Promise((resolve) => {
    setTimeout(async () => {
      const nicheName = criteria.niche?.name;
      const cityName = criteria.city?.name;
      const keywords = generateKeywordVariants(nicheName, cityName);
      const results: KeywordResult[] = [];
      
      for (const keyword of keywords) {
        const searchData = generateMockSearchData(keyword);
        
        // Apply filters
        if (
          searchData.volume >= criteria.searchVolume.min &&
          searchData.volume <= criteria.searchVolume.max &&
          searchData.cpc >= criteria.cpc.min &&
          searchData.cpc <= criteria.cpc.max
        ) {
          // Only check population if city and population criteria are provided
          let populationPass = true;
          if (criteria.population && criteria.city) {
            populationPass = 
              criteria.city.population >= criteria.population.min &&
              criteria.city.population <= criteria.population.max;
          }
          
          if (populationPass) {
            // Check EMD availability (exactmatchdomain.com)
            const domainName = formatForDomain(keyword);
            const domainAvailable = await checkDomainAvailability(keyword);
            const domainLink = domainAvailable ? generateAffiliateLink(keyword) : null;
            
            // Create a unique ID for the result
            const id = `result-${results.length}-${Date.now()}`;
            
            results.push({
              id,
              keyword,
              searchVolume: searchData.volume,
              cpc: searchData.cpc,
              population: criteria.city?.population || null,
              domainAvailable,
              domainLink,
              exactMatchDomain: `${domainName}.com`
            });
          }
        }
      }
      
      resolve(results);
    }, 1500); // Simulate API delay
  });
};
