import React, { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const routes = [
    { href: '/', label: 'Home' },
    { href: '#trends', label: 'Trends' },
    { href: '#maps', label: 'Maps' },
    { href: '#analysis', label: 'Analysis' },
    { href: 'https://github.com/adrianaso/health-and-income', label: 'GitHub', external: true }
  ];

  return (
    <nav className="flex items-center justify-between w-full py-4 px-6 md:px-12 bg-glassy sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2">
          <img 
            src={`${process.env.PUBLIC_URL}/healthviz-logo.svg`} 
            alt="HealthViz Logo" 
            className="h-8 w-auto" 
          />
          <span className="text-xl font-bold font-mono text-primary">HealthViz</span>
        </a>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <a 
              key={route.href} 
              href={route.href}
              target={route.external ? "_blank" : "_self"}
              rel={route.external ? "noopener noreferrer" : ""}
              className="text-sm font-medium relative px-2 py-1 transition-colors hover:text-primary focus:text-primary group"
              style={{ overflow: 'hidden' }}
            >
              <span className="z-10 relative">{route.label}</span>
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-accent to-primary scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
            </a>
          ))}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button 
          aria-label="Toggle menu" 
          className="p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className="fas fa-bars h-5 w-5"></i>
        </button>
        
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-2">
            <div className="py-1">
              {routes.map((route) => (
                <a
                  key={route.href}
                  href={route.href}
                  target={route.external ? "_blank" : "_self"}
                  rel={route.external ? "noopener noreferrer" : ""}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {route.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
