const citySelect = document.getElementById('citySelect');
const weatherIcon = document.querySelector('.weather-icon i');
const temperature = document.querySelector('.temperature h1');
const description = document.querySelector('.description p');
const humidity = document.querySelector('.humidity');
const wind = document.querySelector('.wind');

// OpenWeatherMap API anahtarınızı buraya ekleyin
const apiKey = '0e4e8e60c1faa21fcff0c1235b123e52'; // OpenWeatherMap API anahtarınızı buraya ekleyin

// Dil çevirileri
const translations = {
    tr: {
        humidity: 'Nem',
        wind: 'Rüzgar Hızı',
        feelsLike: 'Hissedilen',
        sunrise: 'Gün Doğumu',
        sunset: 'Gün Batımı',
        airQuality: 'Hava Kalitesi',
        favorites: 'Favori Şehirler',
        // ... diğer çeviriler
    },
    en: {
        humidity: 'Humidity',
        wind: 'Wind Speed',
        feelsLike: 'Feels Like',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        airQuality: 'Air Quality',
        favorites: 'Favorite Cities',
        // ... diğer çeviriler
    }
};

async function getWeatherData(cityName) {
    try {
        // Mevcut hava durumu için API çağrısı
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName},TR&units=metric&lang=tr&appid=${apiKey}`
        );
        
        if (!currentResponse.ok) {
            throw new Error(`HTTP error! status: ${currentResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        console.log('Current Weather Data:', currentData); // Debug için

        // 5 günlük tahmin için API çağrısı
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityName},TR&units=metric&lang=tr&appid=${apiKey}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error(`HTTP error! status: ${forecastResponse.status}`);
        }
        
        const forecastData = await forecastResponse.json();
        console.log('Forecast Data:', forecastData); // Debug için

        // Hava kalitesi verilerini al
        if (currentData.coord) {
            await getAirQuality(currentData.coord.lat, currentData.coord.lon);
        }
        
        // Veriler başarıyla alındığında, varsa hata mesajını kaldır
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Arayüzü güncelle
        updateWeatherUI(currentData, forecastData);
        
        // Sıcaklık grafiğini güncelle
        createTemperatureChart(forecastData);

    } catch (error) {
        console.error('Hata detayı:', error);
        showError('Hava durumu bilgileri alınamadı. Lütfen tekrar deneyin.');
    }
}

function updateWeatherUI(currentData, forecastData) {
    // Ana hava durumu bilgilerini güncelle
    temperature.textContent = `${Math.round(currentData.main.temp)}°C`;
    description.textContent = currentData.weather[0].description;
    humidity.textContent = `${currentData.main.humidity}%`;
    wind.textContent = `${currentData.wind.speed} km/s`;
    
    // Hissedilen sıcaklık
    document.querySelector('.feels-like').textContent = 
        `Hissedilen: ${Math.round(currentData.main.feels_like)}°C`;

    // Gün doğumu ve batımı
    const sunrise = new Date(currentData.sys.sunrise * 1000);
    const sunset = new Date(currentData.sys.sunset * 1000);
    
    document.querySelector('.sunrise').textContent = 
        `Gün Doğumu: ${sunrise.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;
    document.querySelector('.sunset').textContent = 
        `Gün Batımı: ${sunset.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;

    // Hava durumu ikonunu güncelle
    updateWeatherIcon(currentData.weather[0].icon);

    // 5 günlük tahmini güncelle
    updateForecast(forecastData);
}

function updateWeatherIcon(iconCode) {
    // OpenWeatherMap ikon kodlarına göre Font Awesome ikonlarını eşleştir
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud',
        '04n': 'cloud',
        '09d': 'cloud-showers-heavy',
        '09n': 'cloud-showers-heavy',
        '10d': 'cloud-rain',
        '10n': 'cloud-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };

    const iconClass = iconMap[iconCode] || 'question';
    weatherIcon.className = `fas fa-${iconClass}`;
}

function updateForecast(forecastData) {
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = ''; // Mevcut tahminleri temizle

    // Her gün için bir tahmin göster (5 gün)
    const dailyForecasts = forecastData.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    ).slice(0, 5);

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        
        // Min-max sıcaklıkları bul
        const temp = Math.round(day.main.temp);
        const tempMin = Math.round(day.main.temp_min);
        const tempMax = Math.round(day.main.temp_max);
        
        forecastDay.innerHTML = `
            <div class="day-name">${dayName}</div>
            <i class="fas fa-${updateWeatherIcon(day.weather[0].icon)}"></i>
            <div class="temp">${temp}°C</div>
            <div class="temp-range">
                <span>${tempMin}°</span>
                <span>${tempMax}°</span>
            </div>
            <div class="forecast-desc">${day.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastDay);
    });
}

function showError(message) {
    // Varsa önceki hata mesajını kaldır
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Hata mesajını ekle
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // 3 saniye sonra hata mesajını kaldır
    setTimeout(() => {
        const errorToRemove = document.querySelector('.error-message');
        if (errorToRemove) {
            errorToRemove.remove();
        }
    }, 3000);
}

// Event Listeners
citySelect.addEventListener('change', (e) => {
    if (e.target.value) {
        getWeatherData(e.target.value);
    }
});

// Sayfa yüklendiğinde varsayılan şehir için hava durumunu göster
document.addEventListener('DOMContentLoaded', () => {
    getWeatherData('istanbul');
});

// SVG harita etkileşimi için gerekli fonksiyonlar
function initializeMap() {
    const paths = document.querySelectorAll('#svg-turkey-map path');
    
    paths.forEach(path => {
        // Her path elementine event listener ekle
        path.addEventListener('click', (e) => {
            // Önceki seçili şehri temizle
            paths.forEach(p => p.classList.remove('selected'));
            
            // Tıklanan şehri seç
            path.classList.add('selected');
            
            // Şehir adını al ve ilk harfi büyük yap
            const cityName = path.getAttribute('data-city-name');
            const formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
            
            // Dropdown menüyü güncelle
            citySelect.value = cityName;
            
            // Hava durumu verilerini getir
            getWeatherData(formattedCityName);
        });

        // Hover efektleri için event listener'lar
        path.addEventListener('mouseover', () => {
            path.style.opacity = '0.7';
            path.style.cursor = 'pointer';
        });

        path.addEventListener('mouseout', () => {
            path.style.opacity = '1';
        });
    });
}

// Sayfa yüklendiğinde haritayı başlat
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    getWeatherData('İstanbul'); // Varsayılan şehir
});

// Tooltip stili için CSS'e ekle
const style = document.createElement('style');
style.textContent = `
    .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 14px;
        pointer-events: none;
        z-index: 1000;
    }
`;
document.head.appendChild(style);

// Theme switching functionality
function initializeTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    
    // Kayıtlı temayı kontrol et
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.toggle('dark-theme', savedTheme === 'dark');
        updateThemeIcon(savedTheme === 'dark');
    }
    
    // Tema değiştirme butonu için event listener
    themeSwitch.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });
}

function updateThemeIcon(isDark) {
    const sunIcon = document.querySelector('.fa-sun');
    const moonIcon = document.querySelector('.fa-moon');
    
    if (isDark) {
        sunIcon.style.display = 'inline';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline';
    }
}

// Saat ve tarih güncelleme
function updateDateTime() {
    const dateTimeElement = document.querySelector('.date-time');
    const now = new Date();
    const currentLang = localStorage.getItem('language') || 'tr';
    
    dateTimeElement.textContent = now.toLocaleString(
        currentLang === 'tr' ? 'tr-TR' : 'en-US',
        {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}

// Favori şehirler
function initializeFavorites() {
    const favorites = getFavorites();
    updateFavoritesUI(favorites);

    // Favori ekle butonunu dinle
    document.querySelector('.add-favorite').addEventListener('click', () => {
        const citySelect = document.querySelector('#citySelect');
        const selectedCity = citySelect.value;
        addToFavorites(selectedCity);
    });
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function addToFavorites(cityName) {
    const favorites = getFavorites();
    if (!favorites.includes(cityName)) {
        favorites.push(cityName);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesUI(favorites);
    }
}

function removeFromFavorites(cityName) {
    let favorites = getFavorites();
    favorites = favorites.filter(city => city !== cityName);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesUI(favorites);
}

function updateFavoritesUI(favorites) {
    const favoritesList = document.querySelector('.favorites-list');
    favoritesList.innerHTML = '';

    favorites.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'favorite-city';
        cityElement.innerHTML = `
            <span>${city}</span>
            <button class="remove-favorite" onclick="removeFromFavorites('${city}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        cityElement.addEventListener('click', () => {
            document.querySelector('#citySelect').value = city;
            getWeatherData(city);
        });
        favoritesList.appendChild(cityElement);
    });
}

// Hava kalitesi verilerini al
async function getAirQuality(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const data = await response.json();
        updateAirQualityUI(data);
    } catch (error) {
        console.error('Hava kalitesi verileri alınamadı:', error);
    }
}

// Hava kalitesi UI güncelleme
function updateAirQualityUI(data) {
    const aqiElement = document.querySelector('.aqi-value');
    const aqiDescElement = document.querySelector('.aqi-description');
    
    const aqiValues = {
        1: { text: 'İyi', color: '#00b894' },
        2: { text: 'Orta', color: '#00cec9' },
        3: { text: 'Hassas Gruplar İçin Sağlıksız', color: '#fdcb6e' },
        4: { text: 'Sağlıksız', color: '#e17055' },
        5: { text: 'Çok Sağlıksız', color: '#d63031' }
    };

    const aqi = data.list[0].main.aqi;
    const aqiInfo = aqiValues[aqi];

    aqiElement.textContent = `AQI: ${aqi}`;
    aqiElement.style.color = aqiInfo.color;
    aqiDescElement.textContent = aqiInfo.text;
}

// Sıcaklık grafiği oluşturma
function createTemperatureChart(weatherData) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // Eğer önceden bir grafik varsa temizle
    if (window.tempChart instanceof Chart) {
        window.tempChart.destroy();
    }

    const labels = weatherData.daily.map(day => {
        return new Date(day.dt * 1000).toLocaleDateString('tr-TR', { weekday: 'short' });
    });

    const temperatures = weatherData.daily.map(day => ({
        max: Math.round(day.temp.max - 273.15),
        min: Math.round(day.temp.min - 273.15)
    }));

    window.tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'En Yüksek',
                    data: temperatures.map(t => t.max),
                    borderColor: '#e17055',
                    backgroundColor: 'rgba(225, 112, 85, 0.2)',
                    fill: true
                },
                {
                    label: 'En Düşük',
                    data: temperatures.map(t => t.min),
                    borderColor: '#00cec9',
                    backgroundColor: 'rgba(0, 206, 201, 0.2)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#2d3436'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return value + '°C';
                        },
                        color: '#2d3436'
                    }
                },
                x: {
                    ticks: {
                        color: '#2d3436'
                    }
                }
            }
        }
    });
}

// Dil değiştirme
function initializeLanguage() {
    const langButtons = document.querySelectorAll('.language-selector button');
    const currentLang = localStorage.getItem('language') || 'tr';
    
    langButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.lang === currentLang);
        button.onclick = () => changeLanguage(button.dataset.lang);
    });
    
    updateUILanguage(currentLang);
}

function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    updateUILanguage(lang);
    
    // Mevcut hava durumu verilerini yeni dilde güncelle
    const currentCity = document.querySelector('#citySelect').value;
    if (currentCity) {
        getWeatherData(currentCity);
    }
}

function updateUILanguage(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.dataset.translate;
        element.textContent = translations[lang][key];
    });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMap();
    initializeFavorites();
    initializeLanguage();
    getWeatherData('İstanbul');
    
    // Saat ve tarihi güncelle
    updateDateTime();
    setInterval(updateDateTime, 60000); // Her dakika güncelle
}); 