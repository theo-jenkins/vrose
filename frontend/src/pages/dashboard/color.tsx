// pages/colortest.tsx
import React, { useState } from 'react';

const ColorTest: React.FC = () => {
  // State for handling button hover effect
  const [buttonStyle, setButtonStyle] = useState({
    backgroundColor: '#F9DCF3', // button-background
    color: '#191516',           // button-text
  });

  const handleMouseEnter = () => {
    setButtonStyle({
      backgroundColor: '#E1B7D7', // button-background-hover
      color: '#000000',           // button-text-hover
    });
  };

  const handleMouseLeave = () => {
    setButtonStyle({
      backgroundColor: '#F9DCF3', // button-background
      color: '#191516',           // button-text
    });
  };

  return (
    <div className='font-custom'
      style={{
        backgroundColor: '#FFFFFF', // background
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      {/* Primary Text */}
      <h1 style={{ color: '#000000' }}>
        Primary Text (#000000)
      </h1>

      {/* Secondary Text */}
      <p style={{ color: '#BDB2BB' }}>
        Secondary Text (#BDB2BB)
      </p>

      {/* Button Example */}
      <div style={{ margin: '2rem 0' }}>
        <button
          style={{
            backgroundColor: buttonStyle.backgroundColor,
            color: buttonStyle.color,
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Button Test
        </button>
      </div>

      {/* Form Field Example */}
      <div style={{ margin: '2rem 0' }}>
        <input
          type="text"
          placeholder="Form Field Test"
          style={{
            backgroundColor: '#F0DEEC', // form field
            color: '#000000',
            border: '1px solid #BDB2BB',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            width: '100%',
            maxWidth: '400px',
          }}
        />
      </div>

      {/* Accent Color Example */}
      <div style={{ margin: '2rem 0' }}>
        <p style={{ color: '#E00070', fontWeight: 'bold' }}>
          Accent Color (#E00070)
        </p>
      </div>

      {/* Error Color Example */}
      <div style={{ margin: '2rem 0' }}>
        <p style={{ color: '#D00000', fontWeight: 'bold' }}>
          Error Color (#D00000)
        </p>
      </div>
    </div>
  );
};

export default ColorTest;
