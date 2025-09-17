// Utility to fetch and normalize astrophysical event data from multiple sources
import axios from 'axios';

export async function fetchGWOSCEvents() {
  // Example: fetch gravitational wave events from GWOSC
  const url = 'https://www.gw-openscience.org/eventapi/json/events/';
  const res = await axios.get(url);
  return res.data.events.map((event: any) => ({
    source: 'GWOSC',
    event_type: 'gravitational_wave',
    time_utc: event.time,
    ra: event.ra,
    dec: event.dec,
    event_id: event.event_id,
    metadata: event
  }));
}

export async function fetchZTFEvents() {
  // Example: fetch optical transients from ZTF (mock endpoint)
  // Replace with real ZTF API endpoint and auth if needed
  const url = 'https://ztfapi.mock/events';
  const res = await axios.get(url);
  return res.data.events.map((event: any) => ({
    source: 'ZTF',
    event_type: 'optical_transient',
    time_utc: event.jd,
    ra: event.ra,
    dec: event.dec,
    event_id: event.objectid,
    metadata: event
  }));
}

export async function fetchHEASARCEvents() {
  // Example: fetch high-energy events from NASA HEASARC (mock endpoint)
  const url = 'https://heasarc.mock/events';
  const res = await axios.get(url);
  return res.data.events.map((event: any) => ({
    source: 'HEASARC',
    event_type: event.type || 'gamma_ray_burst',
    time_utc: event.time,
    ra: event.ra,
    dec: event.dec,
    event_id: event.id,
    metadata: event
  }));
}

export async function fetchSIMBADObjects(ra: number, dec: number) {
  // Example: fetch nearby objects from SIMBAD (mock endpoint)
  const url = `https://simbad.mock/objects?ra=${ra}&dec=${dec}`;
  const res = await axios.get(url);
  return res.data.objects;
}

export async function fetchAllAstroEvents() {
  // Fetch all events from all sources and combine
  const [gwosc, ztf, heasarc] = await Promise.all([
    fetchGWOSCEvents(),
    fetchZTFEvents(),
    fetchHEASARCEvents()
  ]);
  return [...gwosc, ...ztf, ...heasarc];
}
