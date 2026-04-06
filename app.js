const API_BASE = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  const input    = document.getElementById('cityInput');
  const clearBtn = document.getElementById('clearInputBtn');
  input.addEventListener('input', () => {
    clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
  });
});

function clearInput() {
  document.getElementById('cityInput').value = '';
  document.getElementById('clearInputBtn').style.display = 'none';
  document.getElementById('cityInput').focus();
}

async function searchWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;
  showError('');
  showLoading();
  try {
    const weatherRes  = await fetch(`${API_BASE}/weather/${encodeURIComponent(city)}`);
    const weatherData = await weatherRes.json();
    if (!weatherRes.ok) { showError(weatherData.error || 'Something went wrong'); hideWeatherCard(); return; }
    displayWeather(weatherData);

    const forecastRes  = await fetch(`${API_BASE}/forecast/${encodeURIComponent(city)}`);
    const forecastData = await forecastRes.json();
    if (forecastRes.ok) displayForecast(forecastData);

    const hourlyRes  = await fetch(`${API_BASE}/hourly/${encodeURIComponent(city)}`);
    const hourlyData = await hourlyRes.json();
    if (hourlyRes.ok) displayHourly(hourlyData);

    loadHistory();
  } catch (err) {
    showError('Cannot connect to server. Make sure the backend is running.');
    hideWeatherCard();
  }
}

function displayWeather(data) {
  document.getElementById('cityName').textContent    = data.city;
  document.getElementById('countryName').textContent = `📍 ${data.city}${data.state ? ', ' + data.state : ''}, ${data.country}`;
  document.getElementById('temperature').textContent = Math.round(data.temperature);
  document.getElementById('feelsLike').textContent   = `${Math.round(data.feels_like)}°C`;
  document.getElementById('humidity').textContent    = `${data.humidity}%`;
  document.getElementById('wind').textContent        = `${data.wind_speed} m/s`;
  document.getElementById('pressure').textContent    = `${data.pressure} hPa`;
  document.getElementById('description').textContent = data.description;
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
  document.getElementById('weatherCard').classList.remove('hidden');
}

function displayHourly(hourly) {
  const container = document.getElementById('hourlySection');
  const track     = document.getElementById('hourlyTrack');
  track.innerHTML = '';

  const temps = hourly.map(h => h.temp);
  const minT  = Math.min(...temps);
  const maxT  = Math.max(...temps);

  hourly.forEach((item) => {
    const date  = new Date(item.time * 1000);
    const hour  = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const now   = new Date();
    const isNow = Math.abs(date - now) < 1800000;

    const ratio = maxT === minT ? 0.5 : (item.temp - minT) / (maxT - minT);
    let tempColor;
    if (ratio < 0.33)      tempColor = '#8ab4f8';
    else if (ratio < 0.66) tempColor = '#fdd663';
    else                   tempColor = '#f28b82';

    const barH = Math.round(20 + ratio * 40);

    track.innerHTML += `
      <div class="hourly-item ${isNow ? 'hourly-now' : ''}">
        <div class="hourly-time">${isNow ? 'Now' : hour}</div>
        <img class="hourly-icon" src="https://openweathermap.org/img/wn/${item.icon}.png" alt=""/>
        <div class="hourly-bar-wrap">
          <div class="hourly-bar" style="height:${barH}px; background:${tempColor};"></div>
        </div>
        <div class="hourly-temp" style="color:${tempColor}">${Math.round(item.temp)}°</div>
        <div class="hourly-desc">${item.description}</div>
      </div>`;
  });

  container.classList.remove('hidden');
}

function displayForecast(forecast) {
  const container = document.getElementById('forecastCards');
  container.innerHTML = '';
  forecast.forEach((item) => {
    const date    = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    container.innerHTML += `
      <div class="forecast-item">
        <div class="forecast-day">${dayName}</div>
        <img class="forecast-icon" src="https://openweathermap.org/img/wn/${item.icon}@2x.png" alt="${item.description}"/>
        <div class="forecast-temp">${Math.round(item.temp)}°C</div>
        <div class="forecast-desc">${item.description}</div>
      </div>`;
  });
  document.getElementById('forecastSection').classList.remove('hidden');
}

function displayWeather(data) {
  document.getElementById('cityName').textContent    = data.city;
  document.getElementById('countryName').textContent = `📍 ${data.city}${data.state ? ', ' + data.state : ''}, ${data.country}`;
  document.getElementById('temperature').textContent = Math.round(data.temperature);
  document.getElementById('feelsLike').textContent   = `${Math.round(data.feels_like)}°C`;
  document.getElementById('humidity').textContent    = `${data.humidity}%`;
  document.getElementById('wind').textContent        = `${data.wind_speed} m/s`;
  document.getElementById('pressure').textContent    = `${data.pressure} hPa`;
  document.getElementById('description').textContent = data.description;
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

  // Google Weather bar
  document.getElementById('gwPrecip').textContent    = `0%`;
  document.getElementById('gwHumidity').textContent  = `${data.humidity}%`;
  document.getElementById('gwWind').textContent      = `${(data.wind_speed * 3.6).toFixed(1)} km/h`;
  document.getElementById('gwDay').textContent       = new Date().toLocaleDateString('en-US', { weekday:'long', hour:'2-digit', minute:'2-digit' });
  document.getElementById('gwCondition').textContent = data.description;

  document.getElementById('weatherCard').classList.remove('hidden');
}
async function loadHistory() {
  try {
    const res       = await fetch(`${API_BASE}/history`);
    const data      = await res.json();
    const container = document.getElementById('historyList');
    if (!data.length) { container.innerHTML = `<p class="no-history">No searches yet...</p>`; return; }
    container.innerHTML = data.map((item) => `
      <div class="history-item" onclick="searchFromHistory('${item.city}')">
        <div>
          <div class="history-city">${item.city}</div>
          <div class="history-meta">${formatDate(item.searched_at)}</div>
        </div>
        <div>
          <div class="history-temp">${Math.round(item.temperature)}°C</div>
          <div class="history-meta" style="text-align:right;">${item.description}</div>
        </div>
      </div>`).join('');
  } catch (err) {
    document.getElementById('historyList').innerHTML = `<p class="no-history">No searches yet...</p>`;
  }
}

function searchFromHistory(city) {
  document.getElementById('cityInput').value = city;
  document.getElementById('clearInputBtn').style.display = 'flex';
  searchWeather();
}

async function clearHistory() {
  try {
    await fetch(`${API_BASE}/history`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.log('Could not reach server');
  } finally {
    document.getElementById('historyList').innerHTML = `<p class="no-history">No searches yet...</p>`;
  }
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (msg) { el.textContent = msg; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}
function hideWeatherCard() {
  document.getElementById('weatherCard').classList.add('hidden');
  document.getElementById('forecastSection').classList.add('hidden');
  document.getElementById('hourlySection').classList.add('hidden');
}
function showLoading() {
  document.getElementById('weatherCard').classList.add('hidden');
  document.getElementById('forecastSection').classList.add('hidden');
  document.getElementById('hourlySection').classList.add('hidden');
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

document.getElementById('cityInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchWeather();
});

window.onload = loadHistory;