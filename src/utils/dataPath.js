/**
 * Data import utility for CSV files
 * This uses embedded CSV data to ensure it's always available
 */

import { getCSVData } from './csvData';

/**
 * Get the content of a data file by its filename
 * @param {string} filename - The name of the data file
 * @returns {string} The content of the data file
 */
const getDataContent = (filename) => {
  console.log(`Getting data content for: ${filename}`);
  
  try {
    return getCSVData(filename);
  } catch (error) {
    console.error(`Error getting data for ${filename}:`, error);
    throw error;
  }
};

export default getDataContent;
