
/**
 * Parses CSV content to extract city data
 * @param content CSV content as string
 * @returns Array of parsed city objects
 */
export const parseCitiesCsv = (content: string): { name: string; population: number }[] => {
  const lines = content.split('\n');
  const results: { name: string; population: number }[] = [];
  
  // Skip header row if present
  const startIndex = lines[0].toLowerCase().includes('name') && 
                     lines[0].toLowerCase().includes('population') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = line.split(',');
      if (values.length >= 2) {
        const name = values[0].trim();
        const population = parseInt(values[1].trim(), 10);
        
        if (name && !isNaN(population)) {
          results.push({ name, population });
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
