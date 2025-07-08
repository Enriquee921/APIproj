// Uses Open-Meteo API and Nominatim for geocoding
const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');

let map, marker;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;
    weatherResult.textContent = 'Loading...';
    try {
        // Get coordinates from city name using Nominatim
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
        const geoData = await geoRes.json();
        if (!geoData.length) {
            weatherResult.textContent = 'City not found.';
            if (map) map.setView([0,0], 2);
            if (marker) marker.remove();
            return;
        }
        const { lat, lon, display_name } = geoData[0];
        // Get weather from Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        if (!weatherData.current_weather) {
            weatherResult.textContent = 'Weather data not available.';
            if (map) map.setView([lat, lon], 10);
            if (marker) marker.remove();
            return;
        }
        const w = weatherData.current_weather;
        weatherResult.innerHTML = `
            <h2>${display_name.split(',')[0]}</h2>
            <p><strong>Temperature:</strong> ${w.temperature}°C</p>
            <p><strong>Weather:</strong> ${weatherDescription(w.weathercode)}</p>
            <p><strong>Wind:</strong> ${w.windspeed} km/h</p>
        `;

        // Show map and marker
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 10);
        }
        if (marker) marker.remove();
        marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${display_name.split(',')[0]}</b><br>Temp: ${w.temperature}°C<br>${weatherDescription(w.weathercode)}`)
            .openPopup();
    } catch (err) {
        weatherResult.textContent = 'Error fetching weather.';
        if (map) map.setView([0,0], 2);
        if (marker) marker.remove();
    }
});

function weatherDescription(code) {
    // Open-Meteo weather codes
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Dense drizzle',
        56: 'Freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Rain',
        65: 'Heavy rain',
        66: 'Freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with heavy hail',
    };
    return codes[code] || 'Unknown';
}
