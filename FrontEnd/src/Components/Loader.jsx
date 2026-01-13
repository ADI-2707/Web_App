import React, { useState, useEffect } from "react";

const Loader = ({ isLoading }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout;
    if (isLoading) {
      // Delay showing the loader by 300ms to avoid flickering on fast connections
      timeout = setTimeout(() => setShow(true), 300);
    } else {
      setShow(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;