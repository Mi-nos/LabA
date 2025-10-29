document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    var lat;
    var lon;
    var API_KEY = "f21023bef09e627ddc3fdbea7063b51f"; //zastąp go potem swoim

    const weatherButton = document.getElementById('weather_button');
    const tempEl = document.querySelector('.temperature');
    const descEl = document.querySelector('.description');
    const locEl = document.querySelector('.location');
    const iconEl = document.querySelector('.weather-icon');

    //dla pogody 5 dniowej zrobimy grida 2x3 z 6 dniami
    function updateUI(data) {
        if (!data) return;
        const name = data.name || 'nieznana lokalizacja';
        const main = data.main || {};
        const weather0 = (data.weather && data.weather[0]) || {};
        const temp = typeof main.temp === 'number' ? Math.round(main.temp) + '°C' : 'brak danych';
        const desc = weather0.description || 'brak opisu';
        const iconCode = weather0.icon; // e.g., "10d"

        if (tempEl) tempEl.textContent = temp;
        if (descEl) descEl.textContent = desc;
        if (locEl) locEl.textContent = name;
        if (iconEl) {
            if (iconCode) {
                iconEl.innerHTML = `<img alt="${desc}" src="https://openweathermap.org/img/wn/${iconCode}@2x.png">`;
            } else {
                iconEl.textContent = '—';
            }
        }
    }
    //dane geolokalizacyjne
    //https://api.openweathermap.org/geo/1.0/direct?q=Warsaw,PL&limit=1&appid=TWÓJ_API_KEY
    //5 dniowy forecast dla fetcha
    //api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}

    function xhrPromise(url) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true); //chciałem robić z async false ale jest deprecated to nie wypada
            req.timeout = 5000;

            req.onload = function () {
                if (req.status >= 200 && req.status < 300) {
                    try {
                        var data = JSON.parse(req.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(new Error('Błąd parsowania JSON: ' + e.message));
                    }
                } else {
                    reject(new Error('Błąd API: ' + req.status));
                }
            };

            req.onerror = function () {
                reject(new Error('Błąd połączenia'));
            };

            req.ontimeout = function () {
                reject(new Error('Przekroczono czas oczekiwania'));
            };

            req.send();
        });
    }
    function fetchForecastData(lat, lon) {
        var forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`;
        return fetch(forecastUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('Błąd API prognozy: ' + response.status);
                return response.json();
            });
    }

    if (weatherButton) {
        weatherButton.addEventListener('click', function () {
            var city = document.getElementById('weather_input').value.trim();
            if (!city) {
                descEl.textContent = 'Wpisz nazwę miasta!';
                return;
            }

            var geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;

            var coords = {}; // tu trzymamy lat i lon

            xhrPromise(geoUrl)
                .then(function (geoData) {
                    if (geoData.length === 0) throw new Error('Nieznana lokalizacja');

                    coords.lat = geoData[0].lat;
                    coords.lon = geoData[0].lon;
                    var name = geoData[0].name;
                    var country = geoData[0].country;

                    console.log(`Miasto: ${name}, lat=${coords.lat}, lon=${coords.lon}`);
                    descEl.textContent = `🌍 ${name}, ${country}`;

                    // 2️⃣ Drugi request — aktualna pogoda
                    var weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=pl`;
                    return xhrPromise(weatherUrl);
                })
                .then(function (weatherData) {
                    console.log('Pogoda:', weatherData);
                    updateUI(weatherData);

                    // 3️⃣ Trzeci request — 5-dniowa prognoza
                    return fetchForecastData(coords.lat, coords.lon);
                })
                .then(function (forecastData) {
                    console.log('Prognoza 5-dniowa:', forecastData);
                    //updateUI(forecastData); // np. wyświetl listę prognoz
                })
                .catch(function (error) {
                    console.error(error);
                    descEl.textContent = error.message;
                });
        });
    }

});