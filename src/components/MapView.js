// src/components/MapView.js
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';
import RoutingService from '../services/RoutingService';
import carIcon from '../assets/car.svg';
import bikeIcon from '../assets/bike.svg';
import walkIcon from '../assets/walk.svg';
import clockIcon from '../assets/clock.svg';

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

/** Bolha de tempo de DESLOCAMENTO na rota com múltiplos modos */
function createTravelTimeIcon(routes) {
  let html = '<div class="time-bubble-multi">';
  let hasAnyRoute = false;

  // Exibe tempo de carro
  if (routes.driving && routes.driving.duration) {
    const minutes = Math.ceil(routes.driving.duration / 60);
    html += `<div class="time-item"><img src="${carIcon}" alt="Carro" class="transport-icon" /> ${minutes}min</div>`;
    hasAnyRoute = true;
  }

  // Exibe tempo de bicicleta
  if (routes.bike && routes.bike.duration) {
    const minutes = Math.ceil(routes.bike.duration / 60);
    html += `<div class="time-item"><img src="${bikeIcon}" alt="Bicicleta" class="transport-icon" /> ${minutes}min</div>`;
    hasAnyRoute = true;
  }

  // Exibe tempo a pé
  if (routes.foot && routes.foot.duration) {
    const minutes = Math.ceil(routes.foot.duration / 60);
    html += `<div class="time-item"><img src="${walkIcon}" alt="A pé" class="transport-icon" /> ${minutes}min</div>`;
    hasAnyRoute = true;
  }

  // Se nenhuma rota foi encontrada, exibe mensagem
  if (!hasAnyRoute) {
    html += '<div class="time-item">Calculando...</div>';
  }

  html += '</div>';

  return L.divIcon({
    className: 'time-marker-div',
    html: html,
    iconSize: [160, 100],
    iconAnchor: [80, 50],
  });
}

/** Bolha de tempo de ESPERA na UPA (ao lado do marcador) */
function createWaitTimeIcon(waitTime, color) {
  return L.divIcon({
    className: 'wait-time-marker-div',
    html: `
      <div class="wait-time-bubble">
        <img src="${clockIcon}" alt="Tempo de espera" class="wait-icon-svg" />
        <span class="wait-value">${waitTime}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [-15, 20],
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

/** Define a cor da rota com base no status da UPA */
function getRouteColor(upaId, bestUpaId, worstUpaId, upas) {
  if (!upaId || !upas) return '#EA4335';
  
  const upa = upas.find(u => u.id === upaId);
  if (!upa || !upa.queueDetail) return '#EA4335';
  
  const totalQueue = Object.values(upa.queueDetail).reduce((a, b) => a + b, 0);
  
  if (upaId === bestUpaId) return '#34A853';
  if (upaId === worstUpaId) return '#EA4335';
  
  if (totalQueue > 15) return '#EA4335';
  if (totalQueue > 9) return '#FBBC05';
  return '#34A853';
}

/** Retorna a cor para o indicador de tempo de espera */
function getWaitTimeColor(total) {
  if (total > 15) return '#EA4335';
  if (total > 9) return '#FBBC05';
  return '#34A853';
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

function MapView({ upas, selectedUpa, userLocation, routesData, bestUpaId, worstUpaId, isSidebarOpen }) {
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
          const route = routesData[upa.id];
          return (
            <React.Fragment key={upa.id}>
              <Circle center={[upa.lat, upa.lng]} pathOptions={getCircleOptions(totalQueue)} />
              <Marker position={[upa.lat, upa.lng]} icon={getMarkerIcon(totalQueue)}>
                <Popup minWidth={280} maxWidth={320}>
                  <div style={{ padding: '8px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700' }}>
                      <Link to={`/upa/${upa.id}`} className="dash-link">{upa.name}</Link>
                    </h3>
                    <p style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#6c757d' }}>{upa.address}</p>
                    <p style={{ margin: '0 0 8px', fontSize: '0.95rem' }}><strong>Tempo de espera:</strong> {upa.averageWaitTime}</p>
                    {route && (route.driving || route.bike || route.foot) && (
                      <div style={{ marginTop: 12, borderTop: '2px solid #e0e0e0', paddingTop: 10 }}>
                        <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '8px' }}>Tempo de deslocamento:</strong>
                        {route.driving && route.driving.duration && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.9rem' }}>
                            <img src={carIcon} alt="Carro" style={{ width: '18px', height: '18px' }} />
                            <span><strong>Carro:</strong> {RoutingService.formatDuration(route.driving.duration)} ({RoutingService.formatDistance(route.driving.distance)})</span>
                          </div>
                        )}
                        {route.bike && route.bike.duration && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.9rem' }}>
                            <img src={bikeIcon} alt="Bicicleta" style={{ width: '18px', height: '18px' }} />
                            <span><strong>Bicicleta:</strong> {RoutingService.formatDuration(route.bike.duration)} ({RoutingService.formatDistance(route.bike.distance)})</span>
                          </div>
                        )}
                        {route.foot && route.foot.duration && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.9rem' }}>
                            <img src={walkIcon} alt="A pé" style={{ width: '18px', height: '18px' }} />
                            <span><strong>A pé:</strong> {RoutingService.formatDuration(route.foot.duration)} ({RoutingService.formatDistance(route.foot.distance)})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
              {/* Indicador de tempo de espera flutuando sobre a UPA */}
              <Marker
                position={[upa.lat, upa.lng]}
                icon={createWaitTimeIcon(upa.averageWaitTime, getWaitTimeColor(totalQueue))}
              />
            </React.Fragment>
          );
        })}

        {/* Rotas com tempos de DESLOCAMENTO (carro, bike, pé) */}
        {upas.map((upa) => {
          const route = routesData[upa.id];
          if (!route || !route.coords) return null;
          const color = getRouteColor(upa.id, bestUpaId, worstUpaId, upas);
          const midpoint = getMidpoint(route.coords);
          return (
            <React.Fragment key={`route-${upa.id}`}>
              <DoublePolyline coords={route.coords} color={color} />
              {midpoint && route.driving && (
                <Marker position={midpoint} icon={createTravelTimeIcon({
                  driving: route.driving,
                  bike: route.bike,
                  foot: route.foot
                })} />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      <div className={`map-legends-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="map-legend classification-legend">
          <h4>Classificação de Risco</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="badge blue" />
              <span>Não Urgente</span>
            </div>
            <div className="legend-item">
              <span className="badge green" />
              <span>Pouco Urgente</span>
            </div>
            <div className="legend-item">
              <span className="badge yellow" />
              <span>Urgente</span>
            </div>
            <div className="legend-item">
              <span className="badge red" />
              <span>Emergência</span>
            </div>
          </div>
        </div>

        <div className="map-legend indicators-legend">
          <h4>Indicadores</h4>
          <div className="legend-items">
            <div className="legend-item">
              <img src={carIcon} alt="Carro" className="legend-transport-icon" />
              <span>Carro</span>
            </div>
            <div className="legend-item">
              <img src={bikeIcon} alt="Bicicleta" className="legend-transport-icon" />
              <span>Bicicleta</span>
            </div>
            <div className="legend-item">
              <img src={walkIcon} alt="A pé" className="legend-transport-icon" />
              <span>A pé</span>
            </div>
            <div className="legend-item">
              <img src={clockIcon} alt="Tempo de espera" className="legend-transport-icon" />
              <span>Tempo de espera</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;