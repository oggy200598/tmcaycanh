import React, { createContext, useContext, useState, useEffect } from 'react';

export const PRESET_LOCATIONS = [
  { name: 'TP. Hồ Chí Minh (Quận 1)', lat: 10.7745, lon: 106.7032, temp: 31, humidity: 72, soil: 'Đất phù sa bồi lắng' },
  { name: 'TP. Thủ Đức (KĐT Sala)', lat: 10.7681, lon: 106.7214, temp: 30, humidity: 75, soil: 'Đất thịt phù sa' },
  { name: 'TP. Hồ Chí Minh (Quận 12)', lat: 10.8672, lon: 106.6853, temp: 31, humidity: 70, soil: 'Đất pha cát nhẹ' },
  { name: 'TP. Đà Lạt (Lâm Đồng)', lat: 11.9404, lon: 108.4182, temp: 18, humidity: 85, soil: 'Đất đỏ bazan cao nguyên' },
  { name: 'Chợ Lách (Bến Tre)', lat: 10.2541, lon: 106.1265, temp: 29, humidity: 80, soil: 'Đất phù sa ngọt sông Tiền' },
  { name: 'Hà Nội (Hoàn Kiếm)', lat: 21.0285, lon: 105.8542, temp: 24, humidity: 68, soil: 'Đất phù sa sông Hồng' },
];

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem('tm_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return PRESET_LOCATIONS[0];
      }
    }
    return PRESET_LOCATIONS[0];
  });

  useEffect(() => {
    localStorage.setItem('tm_location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  const setCoordinates = (lat, lon, name = 'Vị trí ghim trên bản đồ') => {
    setCurrentLocation((prev) => ({
      ...prev,
      lat: Number(lat),
      lon: Number(lon),
      name,
    }));
  };

  const selectPreset = (preset) => {
    setCurrentLocation(preset);
  };

  const detectBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates(pos.coords.latitude, pos.coords.longitude, 'Vị trí GPS hiện tại của bạn');
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        }
      );
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCoordinates,
        selectPreset,
        detectBrowserLocation,
        presets: PRESET_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
