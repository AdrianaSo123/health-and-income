import React from 'react';

const Footer = () => {
  return (
    <footer
      className="bg-gray-100 bg-opacity-50 backdrop-filter backdrop-blur-md py-12"
      style={{ fontFamily: 'font-mono' }}
    >
      <div className="container mx-auto px-4 flex justify-between">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Health and Income. All rights reserved.
        </p>
        <ul className="flex items-center space-x-4">
          <li>
            <a
              href="https://github.com/adrianaso/health-and-income"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition duration-300"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/adriana-so-122ab5122/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition duration-300"
            >
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
