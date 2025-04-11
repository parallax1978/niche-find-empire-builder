
import { City, Niche } from '@/types';

export const parseCitiesCsv = (content: string): City[] => {
  const lines = content.split('\n');
  const results: City[] = [];
  let emptyPopulationCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  
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
                    headerRow.includes('state') || 
                    headerRow.includes('population');
  
  const startIndex = hasHeader ? 1 : 0;
  
  // EXPLICITLY set the column indexes to match the desired order: City (first), State (second), Population (third)
  let cityIndex = 0;
  let stateIndex = 1;
  let populationIndex = 2;
  
  if (hasHeader) {
    const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
    console.log("CSV headers:", headers);
    
    // Flexible header detection, but prioritize the order: City, State, Population
    cityIndex = headers.indexOf('city') !== -1 ? headers.indexOf('city') : 0;
    stateIndex = headers.indexOf('state') !== -1 ? headers.indexOf('state') : 1;
    populationIndex = headers.indexOf('population') !== -1 ? headers.indexOf('population') : 2;
    
    console.log(`Using cityIndex: ${cityIndex}, stateIndex: ${stateIndex}, populationIndex: ${populationIndex}`);
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(';') ? ';' : ',';
      const values = line.split(delimiter).map(val => val.trim());
      
      if (values.length >= Math.max(cityIndex + 1, stateIndex + 1, populationIndex + 1)) {
        const cityName = values[cityIndex]?.trim().replace(/["']/g, '');
        
        // Process the state - ensure it's 2 characters
        let stateCode = values[stateIndex]?.trim().replace(/["']/g, '').toUpperCase();
        if (!stateCode) {
          console.log(`Missing state code at row ${i+1} for city "${cityName}"`);
          skippedCount++;
          continue;
        }
        
        // Ensure state code is exactly 2 characters
        if (stateCode.length !== 2) {
          if (stateCode.length > 2) {
            stateCode = stateCode.substring(0, 2);
            console.log(`Abbreviated state code at row ${i+1}: "${values[stateIndex]}" to "${stateCode}"`);
          } else {
            console.log(`Invalid state code length at row ${i+1}: "${stateCode}"`);
            skippedCount++;
            continue;
          }
        }
        
        // Get the raw population string
        let populationStr = values[populationIndex]?.trim().replace(/["']/g, '');
        
        // Check if population is empty
        if (!populationStr) {
          emptyPopulationCount++;
          if (emptyPopulationCount === 1) {
            console.log(`First empty population found at row ${i+1} for city "${cityName}"`);
          }
          
          // Skip cities with empty population
          skippedCount++;
          continue;
        }
        
        // Convert the population string to a number
        const population = Number(populationStr.replace(/[^\d]/g, ''));
        
        if (cityName && !isNaN(population) && stateCode) {
          results.push({ 
            id: results.length + 1, // Temporary ID generation
            name: cityName,
            state: stateCode,
            population
          });
          
          successCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }
  
  console.log(`CSV parsing summary:
  Total lines: ${lines.length}
  Successfully parsed: ${successCount} cities
  Skipped: ${skippedCount} lines
  Empty population values: ${emptyPopulationCount}
  `);
  
  return results;
};

export const parseNichesCsv = (content: string): Niche[] => {
  const lines = content.split('\n');
  const results: Niche[] = [];
  let successCount = 0;
  let skippedCount = 0;
  
  if (lines.length === 0) {
    console.log("CSV file is empty");
    return results;
  }
  
  // Log the first few lines to help with debugging
  console.log("First line of CSV:", lines[0]);
  if (lines.length > 1) console.log("Second line of CSV:", lines[1]);
  
  // Look for header row
  const headerRow = lines[0].toLowerCase();
  const hasHeader = headerRow.includes('name') || headerRow.includes('niche');
  
  const startIndex = hasHeader ? 1 : 0;
  
  // Default to the first column for name
  let nameIndex = 0;
  
  if (hasHeader) {
    const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
    console.log("CSV headers:", headers);
    
    // Try to find a name or niche column
    nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : 
               (headers.indexOf('niche') !== -1 ? headers.indexOf('niche') : 0);
    
    console.log(`Using nameIndex: ${nameIndex}`);
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(';') ? ';' : ',';
      const values = line.split(delimiter).map(val => val.trim());
      
      if (values.length > nameIndex) {
        const nicheName = values[nameIndex]?.trim().replace(/["']/g, '');
        
        if (nicheName) {
          results.push({ 
            id: results.length + 1, // Temporary ID generation
            name: nicheName
          });
          
          successCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }
  
  console.log(`CSV parsing summary:
  Total lines: ${lines.length}
  Successfully parsed: ${successCount} niches
  Skipped: ${skippedCount} lines
  `);
  
  return results;
};
