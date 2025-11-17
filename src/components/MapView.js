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
import usuarioIcon from '../assets/usuario.png'
import iconGreen from '../assets/icon-green.png';
import iconRed from '../assets/icon-red.png';
import iconYellow from '../assets/icon-yellow.png';

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
  iconUrl: iconRed,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const yellowIcon = L.icon({
  iconUrl: iconYellow,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const greenIcon = L.icon({
  iconUrl: iconGreen,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/** Ícone azul para o usuário */
const userIcon = L.icon({
  iconUrl: usuarioIcon,
  iconSize: [41, 41],
  iconAnchor: [22, 22],
});

/** Bolha unificada com tempo de DESLOCAMENTO e ESPERA */
function createCombinedInfoIcon(routes, upaName, waitTimesByClassification) {
  let html = '<div class="time-bubble-combined">';

  // Nome da UPA no topo
  if (upaName) {
    html += `<div class="time-upa-name">${upaName}</div>`;
  }

  // Seção de Tempo de Espera (PRIMEIRO)
  html += '<div class="info-section">';
  html += '<div class="section-title">Tempo de Espera</div>';

  const classifications = [
    { key: 'vermelho', label: 'Emergência', color: '#B21B1B' },
    { key: 'laranja', label: 'Muito Urgente', color: '#FF8C00' },
    { key: 'amarelo', label: 'Urgente', color: '#E1AF18' },
    { key: 'verde', label: 'Pouco Urgente', color: '#1BB232' },
    { key: 'azul', label: 'Não Urgente', color: '#217BC0' }
  ];

  let hasAnyWaitData = false;
  classifications.forEach(({ key, color }) => {
    if (waitTimesByClassification && waitTimesByClassification[key] !== undefined) {
      const minutes = Math.round(waitTimesByClassification[key]);
      const formattedTime = RoutingService.formatMinutes(minutes);
      html += `<div class="time-item">
        <span class="classification-badge" style="background: ${color};"></span>
        <span class="classification-time">${formattedTime}</span>
      </div>`;
      hasAnyWaitData = true;
    }
  });

  if (!hasAnyWaitData) {
    html += '<div class="time-item">Sem dados</div>';
  }
  html += '</div>';

  // Seção de Deslocamento (DEPOIS)
  html += '<div class="info-section">';
  html += '<div class="section-title">Deslocamento</div>';

  let hasAnyRoute = false;
  if (routes.driving && routes.driving.duration) {
    const formattedTime = RoutingService.formatDuration(routes.driving.duration);
    html += `<div class="time-item"><img src="${carIcon}" alt="Carro" class="transport-icon" /> ${formattedTime}</div>`;
    hasAnyRoute = true;
  }
  if (routes.bike && routes.bike.duration) {
    const formattedTime = RoutingService.formatDuration(routes.bike.duration);
    html += `<div class="time-item"><img src="${bikeIcon}" alt="Bicicleta" class="transport-icon" /> ${formattedTime}</div>`;
    hasAnyRoute = true;
  }
  if (routes.foot && routes.foot.duration) {
    const formattedTime = RoutingService.formatDuration(routes.foot.duration);
    html += `<div class="time-item"><img src="${walkIcon}" alt="A pé" class="transport-icon" /> ${formattedTime}</div>`;
    hasAnyRoute = true;
  }
  if (!hasAnyRoute) {
    html += '<div class="time-item">Calculando...</div>';
  }
  html += '</div>';

  html += '</div>';

  return L.divIcon({
    className: 'time-marker-div',
    html: html,
    iconSize: [180, 220],
    iconAnchor: [-20, 110], // Posiciona à esquerda do ícone da UPA
  });
}

/** Converte statusOcupacao em cor */
function getColorByStatus(statusOcupacao) {
  if (!statusOcupacao) return '#34A853'; // Verde padrão

  const status = statusOcupacao.toUpperCase();
  if (status === 'ALTA') return '#EA4335'; // Vermelho
  if (status === 'MEDIA' || status === 'MÉDIA') return '#FBBC05'; // Amarelo
  return '#34A853'; // Verde (BAIXA)
}

/** Retorna o ícone da UPA conforme o statusOcupacao */
function getMarkerIcon(statusOcupacao) {
  if (!statusOcupacao) return greenIcon;

  const status = statusOcupacao.toUpperCase();
  if (status === 'ALTA') return redIcon;
  if (status === 'MEDIA' || status === 'MÉDIA') return yellowIcon;
  return greenIcon; // BAIXA
}

/** Opções do círculo em volta da UPA */
function getCircleOptions(statusOcupacao) {
  if (!statusOcupacao) {
    return { color: '#34A853', fillColor: '#34A853', fillOpacity: 0.2, radius: 300 };
  }

  const status = statusOcupacao.toUpperCase();
  if (status === 'ALTA')
    return { color: '#EA4335', fillColor: '#EA4335', fillOpacity: 0.2, radius: 500 };
  else if (status === 'MEDIA' || status === 'MÉDIA')
    return { color: '#FBBC05', fillColor: '#FBBC05', fillOpacity: 0.2, radius: 400 };
  else
    return { color: '#34A853', fillColor: '#34A853', fillOpacity: 0.2, radius: 300 };
}

/** Define a cor da rota com base no status da UPA */
function getRouteColor(upaId, bestUpaId, worstUpaId, upas) {
  if (!upaId || !upas) {
    return '#EA4335';
  }

  const upa = upas.find(u => u.id === upaId);
  if (!upa) {
    return '#EA4335';
  }

  // SEMPRE usa a cor baseada no statusOcupacao (igual ao ícone)
  const color = getColorByStatus(upa.statusOcupacao);

  return color;
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

/** Calcula posição adjacente ao ícone da UPA (próxima ao destino) */
function getAdjacentPosition(coords, upaLat, upaLng) {
  if (!coords || coords.length === 0) return null;

  // Simplesmente retorna a posição da UPA
  // O iconAnchor da bolha vai posicionar ela ao lado
  return [upaLat, upaLng];
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
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={false}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2lzbGFueSIsImEiOiJjbWRuazBsMHkwMm9yMndxNGkxNjY1MWlvIn0.ZGrQwbfe8DXTxIQIFdvc6Q`}
          tileSize={512}
          zoomOffset={-1}
          maxZoom={19}
          minZoom={1}
          keepBuffer={8}
          updateWhenIdle={false}
          updateWhenZooming={true}
          updateInterval={100}
          bounds={[[-90, -180], [90, 180]]}
          noWrap={false}
        /> 

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>Você está aqui</Popup>
          </Marker>
        )}

        {upas.map((upa) => {
          const route = routesData[upa.id];
          const markerIcon = getMarkerIcon(upa.statusOcupacao);
          const circleOptions = getCircleOptions(upa.statusOcupacao);

  

          return (
            <React.Fragment key={`marker-${upa.id}-${upa.statusOcupacao}`}>
              <Circle center={[upa.lat, upa.lng]} pathOptions={circleOptions} />
              <Marker position={[upa.lat, upa.lng]} icon={markerIcon}>
                <Popup minWidth={180} maxWidth={200} className="upa-popup">
                  <div className="popup-content">
                    <h3 className="popup-title">
                      <Link to={`/upa/${upa.id}`} className="popup-link">{upa.name}</Link>
                    </h3>
                    <p className="popup-address">{upa.address}</p>

                    <div className="popup-wait-info">
                      <img src={clockIcon} alt="Tempo" className="popup-clock-icon" />
                      <span className="popup-wait-time">{upa.averageWaitTime}</span>
                    </div>

                    {route && (route.driving || route.bike || route.foot) && (
                      <div className="popup-routes">
                        <div className="popup-routes-title">Deslocamento</div>
                        {route.driving && route.driving.duration && (
                          <div className="popup-route-item">
                            <img src={carIcon} alt="Carro" className="popup-route-icon" />
                            <span>{RoutingService.formatDuration(route.driving.duration)}</span>
                            <span className="popup-distance">({RoutingService.formatDistance(route.driving.distance)})</span>
                          </div>
                        )}
                        {route.bike && route.bike.duration && (
                          <div className="popup-route-item">
                            <img src={bikeIcon} alt="Bicicleta" className="popup-route-icon" />
                            <span>{RoutingService.formatDuration(route.bike.duration)}</span>
                            <span className="popup-distance">({RoutingService.formatDistance(route.bike.distance)})</span>
                          </div>
                        )}
                        {route.foot && route.foot.duration && (
                          <div className="popup-route-item">
                            <img src={walkIcon} alt="A pé" className="popup-route-icon" />
                            <span>{RoutingService.formatDuration(route.foot.duration)}</span>
                            <span className="popup-distance">({RoutingService.formatDistance(route.foot.distance)})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Rotas com bolha combinada de informações */}
        {upas.map((upa) => {
          const route = routesData[upa.id];
          if (!route || !route.coords) return null;
          const color = getRouteColor(upa.id, bestUpaId, worstUpaId, upas);
          const adjacentPosition = getAdjacentPosition(route.coords, upa.lat, upa.lng);

          return (
            <React.Fragment key={`route-${upa.id}-${upa.statusOcupacao}`}>
              <DoublePolyline coords={route.coords} color={color} />
              {adjacentPosition && route.driving && (
                <Marker
                  position={adjacentPosition}
                  icon={createCombinedInfoIcon({
                    driving: route.driving,
                    bike: route.bike,
                    foot: route.foot
                  }, upa.name, upa.waitTimesByClassification)}
                />
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
              <span className="badge orange" />
              <span>Muito Urgente</span>
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