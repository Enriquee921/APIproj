document.addEventListener('DOMContentLoaded', function () {
    // OpenWeatherMap API key
    const apiKey = '531e2f52d43cff9fb744b0d8a8248a3c';
    // Default city to display on load
    const defaultCity = 'Manila,PH';


    // UI element references
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const weatherPanel = document.getElementById('weather-panel');
    const loadingElement = document.getElementById('loading');

    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const feelsLike = document.getElementById('feels-like');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const forecastDays = document.getElementById('forecast-days');

    // Map and control buttons
    // const satelliteBtn = document.getElementById('satellite-btn');
    // const radarBtn = document.getElementById('radar-btn');
    // const cloudsBtn = document.getElementById('clouds-btn');
    const streetsLayerBtn = document.getElementById('streets-layer-btn');
    const satelliteLayerBtn = document.getElementById('satellite-layer-btn');
    const terrainLayerBtn = document.getElementById('terrain-layer-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const timeBackBtn = document.getElementById('time-back-btn');
    const timeForwardBtn = document.getElementById('time-forward-btn');
    const timePlayBtn = document.getElementById('time-play-btn');
    const timeDisplay = document.getElementById('time-display');


    // Map and weather layer variables
    let map, marker;
    let streetsLayer, satelliteLayer, terrainLayer;
    // let radarLayer, cloudsLayer;
    let isPlaying = false;
    let playInterval;


    // Initialize map and load default weather
    initMap();
    fetchWeather(defaultCity);


    // Get city query from input, default to PH if no country code
    function getCityQuery() {
        const city = cityInput.value.trim();
        if (!city) return '';
        if (/,[a-zA-Z]{2,}/.test(city)) {
            return city;
        }
        return city + ',PH';
    }


    // Clear weather panel UI
    function clearWeatherPanel() {
        cityName.textContent = '';
        currentDate.textContent = '';
        weatherIcon.src = '';
        weatherIcon.alt = '';
        temperature.textContent = '';
        weatherDescription.textContent = '';
        feelsLike.textContent = '';
        humidity.textContent = '';
        windSpeed.textContent = '';
        forecastDays.innerHTML = '';
    }


    // Search button event: fetch weather for entered city
    searchBtn.addEventListener('click', function () {
        const cityQuery = getCityQuery();
        if (cityQuery) {
            clearWeatherPanel();
            fetchWeather(cityQuery);
        }
    });

    // Enter key event: fetch weather for entered city
    cityInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const cityQuery = getCityQuery();
            if (cityQuery) {
                clearWeatherPanel();
                fetchWeather(cityQuery);
            }
        }
    });

    // Handle search suggestions on input
    cityInput.addEventListener('input', function () {
        const query = cityInput.value.trim();
        if (query.length > 2) {
            fetchCitySuggestions(query);
        } else {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    });


    // Initialize the Leaflet map and layers
    function initMap() {
        // Create map centered on the Philippines
        map = L.map('map', {
            center: [12.8797, 121.7740],
            zoom: 6,
            minZoom: 5,
            maxZoom: 18,
            zoomControl: false,
            attributionControl: false
        });

        // Add base map layers
        streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
            maxZoom: 19
        });

        terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17
        });

        // Weather overlays
        // radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/6/1_1.png', {
        //     attribution: 'Weather data © RainViewer',
        //     opacity: 0.7,
        //     zIndex: 10
        // });

        // cloudsLayer = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02', {
        //     attribution: 'Clouds © OpenWeatherMap',
        //     opacity: 0.7,
        //     zIndex: 11
        // });

        // Add marker for city location
        marker = L.marker([14.5995, 120.9842], {
            icon: L.divIcon({
                className: 'weather-marker',
                html: '<i class="fas fa-map-marker-alt" style="color: #ea4335; font-size: 24px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(map);

        // Setup map controls and buttons
        setupMapControls();
    }


    // Fetch city suggestions from Nominatim
    function fetchCitySuggestions(query) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5`)
            .then(res => res.json())
            .then(data => {
                displaySuggestions(data);
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            });
    }

    // Display city suggestions
    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const suggestionElement = document.createElement('div');
                suggestionElement.classList.add('suggestion-item');
                suggestionElement.textContent = suggestion.display_name;
                suggestionElement.addEventListener('click', function () {
                    cityInput.value = suggestion.display_name;
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.style.display = 'none';
                    clearWeatherPanel();
                    fetchWeather(suggestion.display_name);
                });
                suggestionsContainer.appendChild(suggestionElement);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }


    // Setup all map and UI control button events
    function setupMapControls() {
        // Zoom in/out controls
        zoomInBtn.addEventListener('click', function () {
            map.zoomIn();
        });

        zoomOutBtn.addEventListener('click', function () {
            map.zoomOut();
        });

        // Switch to streets layer
        streetsLayerBtn.addEventListener('click', function () {
            map.addLayer(streetsLayer);
            map.removeLayer(satelliteLayer);
            map.removeLayer(terrainLayer);
            setActiveLayer('streets');
        });

        // Switch to satellite layer
        satelliteLayerBtn.addEventListener('click', function () {
            map.addLayer(satelliteLayer);
            map.removeLayer(streetsLayer);
            map.removeLayer(terrainLayer);
            setActiveLayer('satellite');
        });

        // Switch to terrain layer
        terrainLayerBtn.addEventListener('click', function () {
            map.addLayer(terrainLayer);
            map.removeLayer(streetsLayer);
            map.removeLayer(satelliteLayer);
            setActiveLayer('terrain');
        });

        // Radar and clouds overlay controls removed

        // Time controls for forecast animation
        timeBackBtn.addEventListener('click', function () {
            timeDisplay.textContent = getFormattedTime(-1);
        });

        timeForwardBtn.addEventListener('click', function () {
            timeDisplay.textContent = getFormattedTime(1);
        });

        // Play/pause time animation
        timePlayBtn.addEventListener('click', function () {
            if (isPlaying) {
                stopTimePlayback();
            } else {
                startTimePlayback();
            }
        });
    }


    // Highlight the active map layer button
    function setActiveLayer(layer) {
        streetsLayerBtn.classList.remove('active');
        satelliteLayerBtn.classList.remove('active');
        terrainLayerBtn.classList.remove('active');

        if (layer === 'streets') {
            streetsLayerBtn.classList.add('active');
        } else if (layer === 'satellite') {
            satelliteLayerBtn.classList.add('active');
        } else if (layer === 'terrain') {
            terrainLayerBtn.classList.add('active');
        }
    }


    // Start time animation for forecast (demo only)
    function startTimePlayback() {
        isPlaying = true;
        timePlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        let timeIndex = 0;

        playInterval = setInterval(function () {
            timeIndex++;
            timeDisplay.textContent = getFormattedTime(timeIndex);

            if (timeIndex >= 24) {
                stopTimePlayback();
            }
        }, 1000);
    }

    // Stop time animation
    function stopTimePlayback() {
        isPlaying = false;
        clearInterval(playInterval);
        timePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        timeDisplay.textContent = 'Now';
    }


    // Format time display for time controls
    function getFormattedTime(hoursOffset = 0) {
        const now = new Date();
        now.setHours(now.getHours() + hoursOffset);

        if (hoursOffset === 0) return 'Now';

        return now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) + ' ' +
            now.toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
            });
    }


    // Fetch weather and forecast data for a city
    function fetchWeather(city) {
        showLoading();

        // Geocode city name to get coordinates
        geocodeCity(city, function (lat, lon, displayName) {
            if (lat === 0 && lon === 0) {
                hideLoading();
                return;
            }

            // Move map and marker to city
            map.setView([lat, lon], 10);
            marker.setLatLng([lat, lon]);

            // Fetch current weather
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Weather data not available');
                    }
                    return response.json();
                })
                .then(data => {
                    updateCurrentWeather(data, displayName);

                    // Fetch 5-day forecast
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Forecast not available');
                    }
                    return response.json();
                })
                .then(data => {
                    updateForecast(data);
                    hideLoading();
                })
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    hideLoading();
                });
        });
    }


    // Geocode city name to latitude/longitude using Nominatim
    function geocodeCity(city, callback) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=ph`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    // Found city
                    callback(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
                } else {
                    // Fallback to Philippines center
                    callback(12.8797, 121.7740, 'Philippines');
                }
            })
            .catch(() => callback(12.8797, 121.7740, 'Philippines'));
    }


    // Update the weather panel with current weather data
    function updateCurrentWeather(data, displayName) {
        cityName.textContent = displayName ? displayName : `${data.name}, ${data.sys.country}`;

        // Format and display current date/time
        const now = new Date();
        currentDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Set weather icon and details
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].description;

        temperature.textContent = `${Math.round(data.main.temp)}°C`;
        weatherDescription.textContent = data.weather[0].description;
        feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    }


    // Update the 5-day forecast panel
    function updateForecast(data) {
        forecastDays.innerHTML = '';

        // Group forecast data by day
        const dailyForecasts = {};
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });

            // Pick midday forecast for each day
            if (!dailyForecasts[day] || (date.getHours() >= 11 && date.getHours() <= 13)) {
                dailyForecasts[day] = {
                    day: day,
                    temp: Math.round(forecast.main.temp),
                    icon: forecast.weather[0].icon,
                    description: forecast.weather[0].description
                };
            }
        });

        // Display up to 5 days
        Object.values(dailyForecasts).slice(0, 5).forEach(day => {
            const forecastElement = document.createElement('div');
            forecastElement.className = 'forecast-day';
            forecastElement.innerHTML = `
                        <p>${day.day}</p>
                        <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="forecast-icon">
                        <p>${day.temp}°C</p>
                    `;
            forecastDays.appendChild(forecastElement);
        });
    }

    // Show loading spinner and dim panel
    function showLoading() {
        loadingElement.style.display = 'block';
        weatherPanel.style.opacity = '0.5';
    }

    // Hide loading spinner and restore panel
    function hideLoading() {
        loadingElement.style.display = 'none';
        weatherPanel.style.opacity = '1';
    }
});