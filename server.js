const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = 5000;

const WEATHER_API_KEY  = '09a348fe85274da8678c321c88d2856b';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL          = 'https://api.openweathermap.org/geo/1.0';

let searchHistory = [];

app.use(cors({ origin: '*' }));
app.use(express.json());

async function getCoords(city) {
  const geoRes = await axios.get(
    `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`
  );
  if (!geoRes.data || geoRes.data.length === 0) return null;
  const { lat, lon, name, country, local_names } = geoRes.data[0];
  return { lat, lon, name: local_names?.en || name, country };
}

app.get('/api/weather/:city', async (req, res) => {
  const { city } = req.params;
  try {
    const geoRes = await axios.get(
      `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=5&appid=${WEATHER_API_KEY}`
    );
    if (!geoRes.data || geoRes.data.length === 0) {
      return res.status(404).json({ error: `"${city}" not found. Please check the spelling and try again.` });
    }
    const location     = geoRes.data[0];
    const lat          = location.lat;
    const lon          = location.lon;
    const locationName = location.local_names?.en || location.name;
    const state        = location.state || '';
    const country      = location.country;

    const weatherRes = await axios.get(
      `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const data = weatherRes.data;

    searchHistory.unshift({
      id: Date.now(), city: locationName,
      temperature: data.main.temp,
      description: data.weather[0].description,
      searched_at: new Date().toISOString()
    });
    if (searchHistory.length > 10) searchHistory = searchHistory.slice(0, 10);

    res.json({
      city: locationName, state, country,
      temperature: data.main.temp,
      feels_like:  data.main.feels_like,
      humidity:    data.main.humidity,
      wind_speed:  data.wind.speed,
      description: data.weather[0].description,
      icon:        data.weather[0].icon,
      visibility:  data.visibility,
      pressure:    data.main.pressure,
    });
  } catch (err) {
    res.status(404).json({ error: 'Location not found. Please try another place.' });
  }
});

app.get('/api/forecast/:city', async (req, res) => {
  const { city } = req.params;
  try {
    const coords = await getCoords(city);
    if (!coords) return res.status(404).json({ error: 'Location not found.' });

    const forecastRes = await axios.get(
      `${WEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const daily    = forecastRes.data.list.filter((_, i) => i % 8 === 0).slice(0, 5);
    const forecast = daily.map((item) => ({
      date: item.dt_txt, temp: item.main.temp,
      description: item.weather[0].description,
      icon: item.weather[0].icon, humidity: item.main.humidity,
    }));
    res.json(forecast);
  } catch (err) {
    res.status(404).json({ error: 'Forecast not available.' });
  }
});

app.get('/api/hourly/:city', async (req, res) => {
  const { city } = req.params;
  try {
    const coords = await getCoords(city);
    if (!coords) return res.status(404).json({ error: 'Location not found.' });

    const forecastRes = await axios.get(
      `${WEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const hourly = forecastRes.data.list.slice(0, 8).map((item) => ({
      time:        item.dt,
      temp:        item.main.temp,
      feels_like:  item.main.feels_like,
      description: item.weather[0].description,
      icon:        item.weather[0].icon,
    }));

    res.json(hourly);
  } catch (err) {
    res.status(500).json({ error: 'Hourly forecast not available.' });
  }
});

app.get('/api/history',    (req, res) => res.json(searchHistory));
app.delete('/api/history', (req, res) => { searchHistory = []; res.json({ message: 'History cleared' }); });

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));