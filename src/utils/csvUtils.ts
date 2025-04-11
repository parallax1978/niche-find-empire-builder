
/**
 * Parses CSV content to extract city data
 * @param content CSV content as string
 * @returns Array of parsed city objects
 */
export const parseCitiesCsv = (content: string): { name: string; population: number; state: string }[] => {
  const lines = content.split('\n');
  const results: { name: string; population: number; state: string }[] = [];
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
                    headerRow.includes('population') || 
                    headerRow.includes('state');
  
  const startIndex = hasHeader ? 1 : 0;
  
  // If there's a header, determine column positions
  let cityIndex = 0;
  let stateIndex = 1; // Default state as second column
  let populationIndex = 2; // Default population as third column
  
  if (hasHeader) {
    const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
    console.log("CSV headers:", headers);
    
    cityIndex = headers.indexOf('city');
    if (cityIndex === -1) {
      cityIndex = headers.indexOf('name');
      if (cityIndex === -1) {
        console.log("'city' column not found in headers, using first column");
        cityIndex = 0; // Default to first column if 'city' not found
      } else {
        console.log("'name' column found at index:", cityIndex);
      }
    } else {
      console.log("'city' column found at index:", cityIndex);
    }
    
    stateIndex = headers.indexOf('state');
    if (stateIndex === -1) {
      stateIndex = headers.indexOf('st');
      if (stateIndex === -1) {
        console.log("'state' column not found in headers, using second column");
        stateIndex = 1; // Default to second column if 'state' not found
      } else {
        console.log("'st' column found at index:", stateIndex);
      }
    } else {
      console.log("'state' column found at index:", stateIndex);
    }
    
    populationIndex = headers.indexOf('population');
    if (populationIndex === -1) {
      populationIndex = headers.indexOf('pop');
      if (populationIndex === -1) {
        console.log("'population' column not found in headers, using third column");
        populationIndex = 2; // Default to third column if 'population' not found
      } else {
        console.log("'pop' column found at index:", populationIndex);
      }
    } else {
      console.log("'population' column found at index:", populationIndex);
    }
  }
  
  console.log(`Using cityIndex: ${cityIndex}, stateIndex: ${stateIndex}, populationIndex: ${populationIndex}`);
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(';') ? ';' : ',';
      const values = line.split(delimiter).map(val => val.trim());
      
      if (i === startIndex) {
        console.log(`First data row values (${values.length} columns):`, values);
      }
      
      if (values.length >= Math.max(cityIndex + 1, stateIndex + 1, populationIndex + 1)) {
        const cityName = values[cityIndex]?.trim().replace(/["']/g, ''); // Remove quotes
        
        // Process the state - ensure it's 2 characters
        let stateCode = values[stateIndex]?.trim().replace(/["']/g, '').toUpperCase();
        if (!stateCode) {
          console.log(`Missing state code at row ${i+1} for city "${cityName}"`);
          skippedCount++;
          continue;
        }
        
        // Ensure state code is exactly 2 characters
        if (stateCode.length !== 2) {
          // If longer than 2 chars, try to abbreviate
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
        let populationStr = values[populationIndex]?.trim().replace(/["']/g, ''); // Remove quotes
        
        // Debug logging for the first few rows
        if (i < 5) {
          console.log(`Row ${i+1} raw population string: "${populationStr}"`);
        }
        
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
        
        if (i < 5) {
          console.log(`Row ${i+1} parsed population: ${population}, state: ${stateCode}`);
        }
        
        if (cityName && !isNaN(population) && stateCode) {
          results.push({ 
            name: cityName,
            population,
            state: stateCode
          });
          
          successCount++;
          
          // Log the first few parsed entries
          if (results.length <= 3) {
            console.log(`Parsed city: ${cityName}, population: ${population}, state: ${stateCode}`);
          }
        } else {
          skippedCount++;
          if (skippedCount < 10) {
            console.log(`Skipping row ${i+1} due to invalid data:`, { 
              cityName, 
              populationStr,
              population: isNaN(population) ? 'NaN' : population,
              stateCode
            });
          }
        }
      } else {
        skippedCount++;
        if (skippedCount < 10) {
          console.log(`Skipping row ${i+1} due to insufficient columns. Expected at least ${Math.max(cityIndex + 1, stateIndex + 1, populationIndex + 1)}, got ${values.length}`);
        }
      }
    }
  }
  
  console.log(`CSV parsing summary:
  Total lines: ${lines.length}
  Successfully parsed: ${successCount} cities
  Skipped: ${skippedCount} lines
  Empty population values: ${emptyPopulationCount}
  `);
  
  if (emptyPopulationCount > 0) {
    console.log(`Note: ${emptyPopulationCount} cities were skipped because they had empty population values.
    You may want to check your CSV file and make sure all cities have population values.`);
  }
  
  if (successCount === 0) {
    console.log(`WARNING: No cities were successfully parsed. Please check your CSV format.
    Expected format: City,State(2-letter code),Population
    Example: New York,NY,8804190`);
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
  
  if (lines.length === 0) {
    console.log("CSV file is empty");
    return results;
  }
  
  // Log the first few lines to help with debugging
  console.log("First line of CSV:", lines[0]);
  if (lines.length > 1) console.log("Second line of CSV:", lines[1]);
  
  // Determine if there's a header row
  const headerRow = lines[0].toLowerCase();
  const hasHeader = headerRow.includes('name') || headerRow.includes('niche');
  
  const startIndex = hasHeader ? 1 : 0;
  
  // If there's a header, determine column position
  let nameIndex = 0;
  
  if (hasHeader) {
    const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
    console.log("CSV headers:", headers);
    
    nameIndex = headers.indexOf('name');
    if (nameIndex === -1) {
      nameIndex = headers.indexOf('niche');
      if (nameIndex === -1) {
        console.log("'name' column not found in headers, using first column");
        nameIndex = 0; // Default to first column if 'name' not found
      } else {
        console.log("'niche' column found at index:", nameIndex);
      }
    } else {
      console.log("'name' column found at index:", nameIndex);
    }
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(';') ? ';' : ',';
      const values = line.split(delimiter).map(val => val.trim());
      
      if (values.length > nameIndex) {
        const name = values[nameIndex].replace(/["']/g, '').trim();
        if (name) {
          results.push({ name });
          
          // Log the first few parsed entries
          if (results.length <= 3) {
            console.log(`Parsed niche: ${name}`);
          }
        }
      }
    }
  }
  
  console.log(`Successfully parsed ${results.length} niches`);
  
  return results;
};
