import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/* Ícones dos marcadores */
const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const yellowIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function getMarkerIcon(total) {
  if (total > 15) return redIcon;
  if (total > 9) return yellowIcon;
  return greenIcon;
}

function getCircleOptions(total) {
  if (total > 15) {
    return {
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.2,
      radius: 500,
    };
  } else if (total > 9) {
    return {
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.2,
      radius: 400,
    };
  } else {
    return {
      color: 'green',
      fillColor: 'green',
      fillOpacity: 0.2,
      radius: 300,
    };
  }
}

function MapView({ upas, selectedUpa, sidebarOpen }) {
  const defaultCenter = [-7.23072, -35.8817];
  const center = selectedUpa ? [selectedUpa.lat, selectedUpa.lng] : defaultCenter;
  const zoom = selectedUpa ? 15 : 13;

  // Atualiza tamanho do mapa quando a sidebar muda
  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }, [sidebarOpen]);

  const openWazeDirections = (lat, lng) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  return (
    <MapContainer center={center} zoom={zoom} className="leaflet-container">
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {upas.map(upa => {
        const { blue, green, yellow, red } = upa.queueDetail;
        const totalQueue = blue + green + yellow + red;
        return (
          <React.Fragment key={upa.id}>
            <Circle
              center={[upa.lat, upa.lng]}
              pathOptions={getCircleOptions(totalQueue)}
            />
            <Marker
              position={[upa.lat, upa.lng]}
              icon={getMarkerIcon(totalQueue)}
            >
              <Popup>
                <h3 className="popup-title">{upa.name}</h3>
                <p className="popup-row">{upa.address}</p>
                <p className="popup-row">
                  <strong>Médica(o):</strong> {upa.doctorOnDuty}
                </p>
                <p className="popup-row">
                  <strong>Tempo médio:</strong> {upa.averageWaitTime}
                </p>
                <div className="faixas-grid" style={{ marginTop: '8px' }}>
                  <span className="badge blue" title="Azul">{blue}</span>
                  <span className="badge green" title="Verde">{green}</span>
                  <span className="badge yellow" title="Amarela">{yellow}</span>
                  <span className="badge red" title="Vermelha">{red}</span>
                </div>
                <p style={{ marginTop: '6px' }}>
                  <strong>Total:</strong> {totalQueue} pessoa(s)
                </p>
                <button className="route-button" onClick={() => openWazeDirections(upa.lat, upa.lng)}>
                  Traçar rota
                </button>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}

export default MapView;
