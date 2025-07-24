
"use client";

import React from 'react';

interface MapViewProps {
    position: [number, number];
}

const MapView: React.FC<MapViewProps> = ({ position }) => {
    const [lat, lng] = position;
    // Note: Google Maps embed URLs can sometimes work without an API key for basic loads,
    // but for production use, an API key is recommended to avoid service interruptions.
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapSrc}
                allowFullScreen
                aria-hidden="false"
                tabIndex={0}
            >
            </iframe>
        </div>
    );
};

export default MapView;
