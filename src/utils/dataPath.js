/**
 * Utility function to get the correct path for data files in both development and production
 * This handles the different base paths in GitHub Pages deployment
 */
const getDataPath = (filename) => {
  // Check if we're in production (GitHub Pages) by examining the URL
  // This is more reliable than process.env.NODE_ENV for GitHub Pages
  const isGitHubPages = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';
  
  // Get the base path from package.json homepage or default to '/'
  const basePath = isGitHubPages ? '/health-and-income' : '';
  
  // Log the path being used (for debugging)
  console.log(`Data path for ${filename}: ${basePath}/data/${filename}`);
  
  // Return the complete path
  return `${basePath}/data/${filename}`;
};

export default getDataPath;
