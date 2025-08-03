// src/components/MapView.js
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

/** Recalcula e centraliza o mapa ao mudar center/zoom */
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/** Ícones para as UPAs */
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

/** Ícone azul para o usuário */
const userIcon = L.icon({
  iconUrl: 'https://img.icons8.com/?size=100&id=0hBN66p6eZ8Q&format=png&color=000000',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});


/** Bolha de tempo (X min) no estilo Google Maps (divIcon) */
function createTimeIcon(timeInMin, color) {
  return L.divIcon({
    className: 'time-marker-div',
    html: `
      <div class="time-bubble" style="border:2px solid ${color}; white-space:nowrap;">
        ${timeInMin} min
      </div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });
}

/** Retorna o ícone da UPA conforme a lotação total */
function getMarkerIcon(total) {
  if (total > 15) return redIcon;
  if (total > 9) return yellowIcon;
  return greenIcon;
}

/** Opções do círculo em volta da UPA */
function getCircleOptions(total) {
  if (total > 15)
    return { color: '#EA4335', fillColor: '#EA4335', fillOpacity: 0.2, radius: 500 };
  else if (total > 9)
    return { color: '#FBBC05', fillColor: '#FBBC05', fillOpacity: 0.2, radius: 400 };
  else
    return { color: '#34A853', fillColor: '#34A853', fillOpacity: 0.2, radius: 300 };
}

/** Define a cor da rota com base no padrão Google */
function getRouteColor(upaId, bestUpaId, worstUpaId) {
  if (upaId === bestUpaId) return '#34A853'; // verde forte
  if (upaId === worstUpaId) return '#EA4335'; // vermelho
  return '#EA4335'; // amarelo para intermediárias
}

/** Duas polylines: uma trilha branca e uma colorida por cima */
function DoublePolyline({ coords, color }) {
  if (!coords) return null;
  return (
    <>
      <Polyline positions={coords} color="#FFFFFF" weight={8} opacity={1} />
      <Polyline positions={coords} color={color} weight={5} opacity={1} />
    </>
  );
}

/** Ponto médio das coordenadas para exibir o marker de tempo */
function getMidpoint(coords) {
  if (!coords || coords.length === 0) return null;
  const midIndex = Math.floor(coords.length / 2);
  return coords[midIndex];
}

function MapView({ upas, selectedUpa, userLocation, routesData, bestUpaId, worstUpaId }) {
  const defaultCenter = useMemo(() => [-7.2404146, -35.8883043], []);
  const center = selectedUpa ? [selectedUpa.lat, selectedUpa.lng] : defaultCenter;
  const zoom = selectedUpa ? 15 : 13;

  return (
  <div className="map-wrapper">
    <MapContainer
      center={center}
      zoom={zoom}
      className="leaflet-map"
      zoomAnimation={false}
      fadeAnimation={false}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer 
        attribution='Map data &copy; OpenStreetMap'
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2lzbGFueSIsImEiOiJjbWRuazBsMHkwMm9yMndxNGkxNjY1MWlvIn0.ZGrQwbfe8DXTxIQIFdvc6Q`}
        maxZoom={19}
      />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Você está aqui</Popup>
        </Marker>
      )}

      {upas.map((upa) => {
        const totalQueue = Object.values(upa.queueDetail).reduce((a, b) => a + b, 0);
        return (
          <React.Fragment key={upa.id}>
            <Circle center={[upa.lat, upa.lng]} pathOptions={getCircleOptions(totalQueue)} />
            <Marker position={[upa.lat, upa.lng]} icon={getMarkerIcon(totalQueue)}>
              <Popup>
                <h3 style={{ margin: '0 0 4px' }}>
                  <Link to={`/upa/${upa.id}`} className="dash-link">{upa.name}</Link>
                </h3>
                <p style={{ margin: 0 }}>{upa.address}</p>
                <p style={{ margin: 0 }}><strong>Médica(o):</strong> {upa.doctorOnDuty}</p>
                <p style={{ margin: 0 }}><strong>Tempo médio:</strong> {upa.averageWaitTime}</p>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {upas.map((upa) => {
        const route = routesData[upa.id];
        if (!route || !route.coords) return null;
        const color = getRouteColor(upa.id, bestUpaId, worstUpaId);
        const travelMin = Math.ceil(route.duration / 60);
        const waitMin = parseInt(upa.averageWaitTime.split(" ")[0]);
        const totalMin = travelMin + waitMin;
        const midpoint = getMidpoint(route.coords);
        return (
          <React.Fragment key={`route-${upa.id}`}>
            <DoublePolyline coords={route.coords} color={color} />
            {midpoint && (
              <Marker position={midpoint} icon={createTimeIcon(totalMin, color)} />
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>

    <div className="map-legend">
      <h4>Classificação:</h4>
      <div><span className="badge blue" /> Sem urgência</div>
      <div><span className="badge green" /> Pouco urgente</div>
      <div><span className="badge yellow" /> Urgente</div>
      <div><span className="badge red" /> Emergência</div>
    </div>
  </div>
);


}

export default MapView;
