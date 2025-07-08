 document.addEventListener('DOMContentLoaded', function() {
            // API configuration
            const apiKey = 'abc123yourrealapikey'; // Replace with your actual API key
            const defaultCity = 'Manila,PH';
            
            // DOM elements
            const cityInput = document.getElementById('city-input');
            const searchBtn = document.getElementById('search-btn');
            const weatherPanel = document.getElementById('weather-panel');
            const loadingElement = document.getElementById('loading');
            
            // Weather elements
            const cityName = document.getElementById('city-name');
            const currentDate = document.getElementById('current-date');
            const weatherIcon = document.getElementById('weather-icon');
            const temperature = document.getElementById('temperature');
            const weatherDescription = document.getElementById('weather-description');
            const feelsLike = document.getElementById('feels-like');
            const humidity = document.getElementById('humidity');
            const windSpeed = document.getElementById('wind-speed');
            const forecastDays = document.getElementById('forecast-days');
            
            // Map controls
            const satelliteBtn = document.getElementById('satellite-btn');
            const radarBtn = document.getElementById('radar-btn');
            const cloudsBtn = document.getElementById('clouds-btn');
            const streetsLayerBtn = document.getElementById('streets-layer-btn');
            const satelliteLayerBtn = document.getElementById('satellite-layer-btn');
            const terrainLayerBtn = document.getElementById('terrain-layer-btn');
            const zoomInBtn = document.getElementById('zoom-in-btn');
            const zoomOutBtn = document.getElementById('zoom-out-btn');
            const timeBackBtn = document.getElementById('time-back-btn');
            const timeForwardBtn = document.getElementById('time-forward-btn');
            const timePlayBtn = document.getElementById('time-play-btn');
            const timeDisplay = document.getElementById('time-display');
            
            // Initialize map and weather
            let map, marker;
            let streetsLayer, satelliteLayer, terrainLayer;
            let radarLayer, cloudsLayer;
            let isPlaying = false;
            let playInterval;
            
            initMap();
            fetchWeather(defaultCity);
            
            // Search functionality
            function getCityQuery() {
                const city = cityInput.value.trim();
                if (!city) return '';
                if (/,[a-zA-Z]{2,}/.test(city)) {
                    return city;
                }
                return city + ',PH';
            }

            searchBtn.addEventListener('click', function() {
                const cityQuery = getCityQuery();
                if (cityQuery) {
                    fetchWeather(cityQuery);
                }
            });

            cityInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const cityQuery = getCityQuery();
                    if (cityQuery) {
                        fetchWeather(cityQuery);
                    }
                }
            });
            
            // Initialize map
            function initMap() {
                // Default to Philippines view
                map = L.map('map', {
                    center: [12.8797, 121.7740], // Philippines coordinates
                    zoom: 6,
                    minZoom: 5,
                    maxZoom: 18,
                    zoomControl: false,
                    attributionControl: false
                });
                
                // Base layers
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
                
                // Overlay layers
                radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/6/1_1.png', {
                    attribution: 'Weather data © RainViewer',
                    opacity: 0.7,
                    zIndex: 10
                });
                
                cloudsLayer = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02', {
                    attribution: 'Clouds © OpenWeatherMap',
                    opacity: 0.7,
                    zIndex: 11
                });
                
                // Add marker
                marker = L.marker([14.5995, 120.9842], { // Manila coordinates
                    icon: L.divIcon({
                        className: 'weather-marker',
                        html: '<i class="fas fa-map-marker-alt" style="color: #ea4335; font-size: 24px;"></i>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 24]
                    })
                }).addTo(map);
                
                // Set up event listeners for controls
                setupMapControls();
            }
            
            // Set up map control event listeners
            function setupMapControls() {
                // Zoom controls
                zoomInBtn.addEventListener('click', function() {
                    map.zoomIn();
                });
                
                zoomOutBtn.addEventListener('click', function() {
                    map.zoomOut();
                });
                
                // Layer controls
                streetsLayerBtn.addEventListener('click', function() {
                    streetsLayer.addTo(map);
                    satelliteLayer.remove();
                    terrainLayer.remove();
                    setActiveLayer('streets');
                });
                
                satelliteLayerBtn.addEventListener('click', function() {
                    satelliteLayer.addTo(map);
                    streetsLayer.remove();
                    terrainLayer.remove();
                    setActiveLayer('satellite');
                });
                
                terrainLayerBtn.addEventListener('click', function() {
                    terrainLayer.addTo(map);
                    streetsLayer.remove();
                    satelliteLayer.remove();
                    setActiveLayer('terrain');
                });
                
                // Overlay controls
                radarBtn.addEventListener('click', function() {
                    if (map.hasLayer(radarLayer)) {
                        radarLayer.remove();
                        radarBtn.classList.remove('active');
                    } else {
                        radarLayer.addTo(map);
                        radarBtn.classList.add('active');
                    }
                });
                
                cloudsBtn.addEventListener('click', function() {
                    if (map.hasLayer(cloudsLayer)) {
                        cloudsLayer.remove();
                        cloudsBtn.classList.remove('active');
                    } else {
                        cloudsLayer.addTo(map);
                        cloudsBtn.classList.add('active');
                    }
                });
                
                // Time controls
                timeBackBtn.addEventListener('click', function() {
                    // For demo purposes - would normally go back in time for radar/clouds
                    timeDisplay.textContent = getFormattedTime(-1);
                });
                
                timeForwardBtn.addEventListener('click', function() {
                    // For demo purposes - would normally go forward in time for radar/clouds
                    timeDisplay.textContent = getFormattedTime(1);
                });
                
                timePlayBtn.addEventListener('click', function() {
                    if (isPlaying) {
                        stopTimePlayback();
                    } else {
                        startTimePlayback();
                    }
                });
            }
            
            // Set active base layer
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
            
            // Time playback functions
            function startTimePlayback() {
                isPlaying = true;
                timePlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                let timeIndex = 0;
                
                playInterval = setInterval(function() {
                    timeIndex++;
                    timeDisplay.textContent = getFormattedTime(timeIndex);
                    
                    // In a real app, this would update the radar/cloud layers
                    // to show historical or forecast data
                    
                    if (timeIndex >= 24) {
                        stopTimePlayback();
                    }
                }, 1000);
            }
            
            function stopTimePlayback() {
                isPlaying = false;
                clearInterval(playInterval);
                timePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
                timeDisplay.textContent = 'Now';
            }
            
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
            
            // Fetch weather data from API
            function fetchWeather(city) {
                showLoading();
                
                // First geocode the city to get coordinates
                geocodeCity(city, function(lat, lon) {
                    if (lat === 0 && lon === 0) {
                        hideLoading();
                        return;
                    }
                    
                    // Update map view and marker
                    map.setView([lat, lon], 10);
                    marker.setLatLng([lat, lon]);
                    
                    // Current weather API call
                    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Weather data not available');
                            }
                            return response.json();
                        })
                        .then(data => {
                            updateCurrentWeather(data);
                            // After current weather is loaded, fetch forecast
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
            
            // Geocode city to lat/lon using Nominatim (OpenStreetMap)
            function geocodeCity(city, callback) {
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=ph`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            callback(parseFloat(data[0].lat), parseFloat(data[0].lon));
                        } else {
                            // fallback: center of Philippines
                            callback(12.8797, 121.7740);
                        }
                    })
                    .catch(() => callback(12.8797, 121.7740));
            }
            
            // Update current weather display
            function updateCurrentWeather(data) {
                cityName.textContent = `${data.name}, ${data.sys.country}`;
                
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
                
                const iconCode = data.weather[0].icon;
                weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                weatherIcon.alt = data.weather[0].description;
                
                temperature.textContent = `${Math.round(data.main.temp)}°C`;
                weatherDescription.textContent = data.weather[0].description;
                feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
                humidity.textContent = `${data.main.humidity}%`;
                windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
            }
            
            // Update 5-day forecast display
            function updateForecast(data) {
                forecastDays.innerHTML = '';
                
                // Group forecasts by day
                const dailyForecasts = {};
                data.list.forEach(forecast => {
                    const date = new Date(forecast.dt * 1000);
                    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    // Only take one forecast per day (around noon)
                    if (!dailyForecasts[day] || (date.getHours() >= 11 && date.getHours() <= 13)) {
                        dailyForecasts[day] = {
                            day: day,
                            temp: Math.round(forecast.main.temp),
                            icon: forecast.weather[0].icon,
                            description: forecast.weather[0].description
                        };
                    }
                });
                
                // Display next 5 days
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
            
            // Show loading state
            function showLoading() {
                loadingElement.style.display = 'block';
                weatherPanel.style.opacity = '0.5';
            }
            
            // Hide loading state
            function hideLoading() {
                loadingElement.style.display = 'none';
                weatherPanel.style.opacity = '1';
            }
        });