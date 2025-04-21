/**
 * Data import utility for CSV files
 * This directly imports data files from the src directory
 */

// Import all CSV files directly
import GeorgiaIncomeData from '../data/GeorgiaIncomeData.csv';
import HypertensionCountyData from '../data/HypertensionCountyData.csv';
import HypertensionHistoricalData from '../data/HypertensionHistoricalData.csv';
import GeorgiaRacePopulation from '../data/georgia race population - Sheet1.csv';
import Income2013 from '../data/income2013.csv';
import Income2014 from '../data/income2014.csv';
import Income2015 from '../data/income2015.csv';
import Income2016 from '../data/income2016.csv';
import Income2017 from '../data/income2017.csv';
import Income2018 from '../data/income2018.csv';
import Income2019 from '../data/income2019.csv';
import Income2020 from '../data/income2020.csv';
import Income2021 from '../data/income2021.csv';
import Income2022 from '../data/income2022.csv';
import Income2023 from '../data/income2023.csv';

// Map of filenames to their imported content
const dataFiles = {
  'GeorgiaIncomeData.csv': GeorgiaIncomeData,
  'HypertensionCountyData.csv': HypertensionCountyData,
  'HypertensionHistoricalData.csv': HypertensionHistoricalData,
  'georgia race population - Sheet1.csv': GeorgiaRacePopulation,
  'income2013.csv': Income2013,
  'income2014.csv': Income2014,
  'income2015.csv': Income2015,
  'income2016.csv': Income2016,
  'income2017.csv': Income2017,
  'income2018.csv': Income2018,
  'income2019.csv': Income2019,
  'income2020.csv': Income2020,
  'income2021.csv': Income2021,
  'income2022.csv': Income2022,
  'income2023.csv': Income2023
};

/**
 * Get the content of a data file by its filename
 * @param {string} filename - The name of the data file
 * @returns {string} The content of the data file
 */
const getDataContent = (filename) => {
  console.log(`Getting data content for: ${filename}`);
  
  if (!dataFiles[filename]) {
    console.error(`Data file not found: ${filename}`);
    throw new Error(`Data file not found: ${filename}`);
  }
  
  return dataFiles[filename];
};

export default getDataContent;
