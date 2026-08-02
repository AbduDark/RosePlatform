import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );
};

export default Loader;