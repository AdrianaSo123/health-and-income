/**
 * Utility function to get the correct path for data files in both development and production
 * This handles the different base paths in GitHub Pages deployment
 */
const getDataPath = (filename) => {
  // Check if we're in production (GitHub Pages)
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get the base path from package.json homepage or default to '/'
  const basePath = isProduction ? '/health-and-income' : '';
  
  // Return the complete path
  return `${basePath}/data/${filename}`;
};

export default getDataPath;
