import React from 'react';

function MapEmbed({ location }) {
  if (!location) return null;

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

  return (
    <div className="mt-4">
      <iframe
        title="Google Map"
        width="100%"
        height="250"
        frameBorder="0"
        style={{ border: 0 }}
        src={mapUrl}
        allowFullScreen
      ></iframe>
    </div>
  );
}

export default MapEmbed;
