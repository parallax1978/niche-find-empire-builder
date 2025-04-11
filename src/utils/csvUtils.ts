
/**
 * Parses CSV content to extract city data
 * @param content CSV content as string
 * @returns Array of parsed city objects
 */
export const parseCitiesCsv = (content: string): { name: string; population: number }[] => {
  const lines = content.split('\n');
  const results: { name: string; population: number }[] = [];
  
  if (lines.length === 0) {
    console.log("CSV file is empty");
    return results;
  }
  
  // Log the first few lines to help with debugging
  console.log("First line of CSV:", lines[0]);
  if (lines.length > 1) console.log("Second line of CSV:", lines[1]);
  
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
    console.log("CSV headers:", headers);
    
    cityIndex = headers.indexOf('city');
    if (cityIndex === -1) {
      console.log("'city' column not found in headers, using first column");
      cityIndex = 0; // Default to first column if 'city' not found
    } else {
      console.log("'city' column found at index:", cityIndex);
    }
    
    populationIndex = headers.indexOf('population');
    if (populationIndex === -1) {
      console.log("'population' column not found in headers, using last column");
      populationIndex = headers.length - 1; // Default to last column if 'population' not found
    } else {
      console.log("'population' column found at index:", populationIndex);
    }
  }
  
  console.log(`Using cityIndex: ${cityIndex}, populationIndex: ${populationIndex}`);
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(';') ? ';' : ',';
      const values = line.split(delimiter).map(val => val.trim());
      
      if (i === startIndex) {
        console.log(`First data row values (${values.length} columns):`, values);
      }
      
      if (values.length >= Math.max(cityIndex + 1, populationIndex + 1)) {
        const cityName = values[cityIndex].trim().replace(/["']/g, ''); // Remove quotes if present
        const populationValue = values[populationIndex].trim().replace(/["']/g, '').replace(/,/g, ''); // Clean up population value
        const population = parseInt(populationValue, 10);
        
        if (cityName && !isNaN(population)) {
          results.push({ 
            name: cityName,
            population
          });
        } else {
          console.log(`Skipping row ${i+1} due to invalid data:`, { cityName, populationValue });
        }
      } else {
        console.log(`Skipping row ${i+1} due to insufficient columns. Expected at least ${Math.max(cityIndex + 1, populationIndex + 1)}, got ${values.length}`);
      }
    }
  }
  
  console.log(`Successfully parsed ${results.length} cities`);
  
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
