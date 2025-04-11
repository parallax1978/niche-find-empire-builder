
// Modify the fetchCities function to log more details about the data retrieval
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
