import React from 'react';

import './App.css';



import mapStyles from "./mapStyles"

import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";

import { formatRelative } from "date-fns"

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

import {
  Combobox,
  ComboboxButton,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
  ComboboxInput,
} from "@reach/combobox";

import "@reach/combobox/styles.css"

// import { Map, GoogleApiWrapper} from "google-maps-react";

const libraries = ["places"];
const mapContainerStyle = {
  width: "100vw",
  height: "100vh"
}

const center = {
  lat: 54.8982139,
  lng: 23.9044817
};

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
}

export default function App(){

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback( (map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(( {lat, lng} ) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(14);
  }, []);

  if(loadError) return "Error loading maps";
  if(!isLoaded) return "Loading maps";

  return(
      <div>
        <h1>Monkeys{" "}
          <span role="img" aria-label="bear">
              🐒
          </span>
        </h1>

        <Search panTo={panTo} />
        <Locate panTo={panTo} />

        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={8}
            center={center}
            options={options}
            onClick={
              (event) => {
                setMarkers((current) => [

                  ...current,
                  {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                    time: new Date(),
                  },
                ])
              }
            }
            onLoad={onMapLoad}
        >
          {markers.map((marker) => (
              <Marker
                  key={marker.time.toISOString()}
                  position={{lat: marker.lat, lng: marker.lng}}
                  // icon={<img src="./icons/monkey-marker.png" alt="monkey-icon" />}
                  icon={{
                    url: "/monkey-marker.png",
                    scaledSize: new window.google.maps.Size(30, 30),
                    origin: new window.google.maps.Point(0, 0),
                    anchor: new window.google.maps.Point(15, 15),
                  }}
                  onClick={() => {
                    setSelected(marker);
                  }}
              />
          ))}

          {selected ? (
              <InfoWindow
                  position={{lat: selected.lat, lng: selected.lng}}
                  onCloseClick={() => {
                    setSelected(null);
                  }}
              >
                <div>
                  <h2>Monkey Spotted</h2>
                  <p>Spotted {formatRelative(selected.time, new Date())}</p>
                </div>
              </InfoWindow>
          ) : null}
        </GoogleMap>
      </div>
  )
}

function Locate({panTo}) {
  return (
      <div>
        <button
            className="locate"
            onClick={ () => {
              navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log(position);
                    panTo({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    })
                  }
              )
            }}
        >
          <img
              className="locateIcon"
              src="/compass.png"
              alt="compass - locate me"
          />
        </button>
      </div>
  )
}

function Search({panTo}) {
  const { ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: {
        lat: () => 54.8982139,
        lng: () => 23.9044817,
      },
      radius: 100 * 1000,
    }
  });

  return (
      <div className="search">
        <Combobox
            onSelect={ async (address) => {
              setValue(address, false);
              clearSuggestions();
              try{
                const results = await getGeocode({address});
                const { lat, lng } = await getLatLng(results[0]);
                panTo({lat,lng});
                // console.log({lat, lng})
              }
              catch (e) {
                console.log("error!");
              }

            }}
        >
          <ComboboxInput
              value={value}
              onChange={
                (e) => { setValue(e.target.value); }
              }
              disabled={!ready}
              placeholder="Enter an address"
          />

          <ComboboxPopover>
            <ComboboxList>
              { status === "OK" &&
              data.map( ({ id, description}) => (
                  <ComboboxOption key={id} value={description} />
              ))}
            </ComboboxList>
          </ComboboxPopover>
        </Combobox>
      </div>
  )
}
