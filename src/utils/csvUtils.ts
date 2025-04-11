
/**
 * Parses CSV content to extract city data
 * @param content CSV content as string
 * @returns Array of parsed city objects
 */
export const parseCitiesCsv = (content: string): { name: string; population: number }[] => {
  const lines = content.split('\n');
  const results: { name: string; population: number }[] = [];
  
  // Look for header row to determine column positions
  const headerRow = lines[0].toLowerCase();
  const hasHeader = headerRow.includes('city') || 
                    headerRow.includes('population') || 
                    headerRow.includes('state');
  
  const startIndex = hasHeader ? 1 : 0;
  
  // If there's a header, determine column positions
  let cityIndex = 0;
  let populationIndex = 3; // Default for "city, state, state code, population" format
  
  if (hasHeader) {
    const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
    cityIndex = headers.indexOf('city');
    if (cityIndex === -1) cityIndex = 0; // Default to first column if 'city' not found
    
    populationIndex = headers.indexOf('population');
    if (populationIndex === -1) populationIndex = headers.length - 1; // Default to last column if 'population' not found
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = line.split(',');
      if (values.length >= Math.max(cityIndex + 1, populationIndex + 1)) {
        const cityName = values[cityIndex].trim();
        const population = parseInt(values[populationIndex].trim(), 10);
        
        if (cityName && !isNaN(population)) {
          results.push({ 
            name: cityName,
            population
          });
        }
      }
    }
  }
  
  return results;
};

/**
 * Parses CSV content to extract niche data
 * @param content CSV content as string
 * @returns Array of parsed niche objects
 */
export const parseNichesCsv = (content: string): { name: string }[] => {
  const lines = content.split('\n');
  const results: { name: string }[] = [];
  
  // Skip header row if present
  const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const name = line.replace(',', '').trim();
      if (name) {
        results.push({ name });
      }
    }
  }
  
  return results;
};
