/**
 * Utility function to get data content from CSV files
 * This allows us to access data files in both development and production environments
 */

const getDataContent = (filename: string): string => {
  try {
    // For simplicity, we're using hardcoded data for the hypertension historical data
    if (filename === "HypertensionHistoricalData.csv") {
      return `Survey Period,All,Men,Women
1999-2000,47.0,51.7,42.0
2001-2002,46.0,50.2,41.5
2003-2004,44.9,49.1,40.3
2005-2006,43.8,48.1,39.0
2007-2008,43.2,46.8,39.5
2009-2010,42.1,45.5,38.4
2011-2012,43.9,47.7,39.9
2013-2014,41.7,45.2,38.2
2015-2016,43.6,47.2,39.7
2017-2018,45.4,51.0,39.7`;
    }
    
    // Handle other data files as needed
    return "";
  } catch (error) {
    console.error(`Error loading data file ${filename}:`, error);
    return "";
  }
};

export default getDataContent;
