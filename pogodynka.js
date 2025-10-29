document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    var lat;
    var lon;
    var API_KEY = "f21023bef09e627ddc3fdbea7063b51f"; //to już jest mój api

    const weatherButton = document.getElementById('weather_button');
    const tempEl = document.querySelector('.temperature');
    const descEl = document.querySelector('.description');
    const locEl = document.querySelector('.location');
    const iconEl = document.querySelector('.weather-icon');

    //dla pogody 5 dniowej zrobimy grida 2x3 z 6 dniami
    function updateUI(data) {
        if (!data) return;

        //jeśli dostaniemy odpowiedź requesta na 5 dni
        if (Array.isArray(data.list) && data.city) {
            const container = document.querySelector('.container');
            if (!container) return;

            // usuń stare kafle z poprzedniego requesta
            const tiles = container.querySelectorAll('.container2');
            tiles.forEach(function (el, idx) {
                if (idx > 0) el.remove();
            });

            const byDate = {};
            data.list.forEach(function (entry) {
                const dtTxt = entry.dt_txt || '';
                const day = dtTxt.split(' ')[0];
                if (!day) return;
                if (!byDate[day]) byDate[day] = [];
                byDate[day].push(entry);
            });

            const days = Object.keys(byDate).sort().slice(0, 5);


            //weź 12:00 albo pierwszy
            days.forEach(function (day, idx) {
                const entries = byDate[day];
                let chosen = entries.find(function (e) { return (e.dt_txt || '').includes('12:00:00'); });
                if (!chosen) {
                    chosen = entries[Math.floor(entries.length / 2)] || entries[0];
                }

                const weather0 = (chosen.weather && chosen.weather[0]) || {};
                const main = chosen.main || {};
                const temp = typeof main.temp === 'number' ? Math.round(main.temp) + '°C' : 'brak danych';
                const desc = weather0.description || 'brak opisu';
                const iconCode = weather0.icon;

                const tile = document.createElement('div');
                tile.className = 'container2';

                const info = document.createElement('div');
                info.className = 'weather-info';
                try {
                    const d = new Date(day);
                    const weekday = d.toLocaleDateString('pl-PL', { weekday: 'long' });
                    info.textContent = weekday + ' • ' + day;
                } catch (e) {
                    info.textContent = day;
                }
                //weź ikonki
                const iconElLocal = document.createElement('div');
                iconElLocal.className = 'weather-icon';
                if (iconCode) {
                    iconElLocal.innerHTML = `<img alt="${desc}" src="https://openweathermap.org/img/wn/${iconCode}@2x.png">`;
                } else {
                    iconElLocal.textContent = '—';
                }

                const tempDiv = document.createElement('div');
                tempDiv.className = 'temperature';
                tempDiv.textContent = temp;

                const descDiv = document.createElement('div');
                descDiv.className = 'description';
                descDiv.textContent = desc;
                //nazwy miasta nie dodajemy no bo po co pisać 6x Szczecin?

                tile.appendChild(info);
                tile.appendChild(iconElLocal);
                tile.appendChild(tempDiv);
                tile.appendChild(descDiv);

                container.appendChild(tile);
            });

            return;
        }

        // to jest nasza oryginalna komórka z pogodą
        const name = data.name || 'nieznana lokalizacja';
        const main = data.main || {};
        const weather0 = (data.weather && data.weather[0]) || {};
        const temp = typeof main.temp === 'number' ? Math.round(main.temp) + '°C' : 'brak danych';
        const desc = weather0.description || 'brak opisu';
        const iconCode = weather0.icon;

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
                    // Udany request XHR
                    console.log('XHR JEST OK!', url, 'status:', req.status);
                    try {
                        var data = JSON.parse(req.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(new Error('Błąd parsowania JSON: ' + e.message));
                    }
                } else {
                    reject(new Error('Coś poszło nie tak...: ' + req.status));
                }
            };
            req.send();
        });
    }
    function fetchForecastData(lat, lon) {
        var forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`;
        return fetch(forecastUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('Błąd API prognozy: ' + response.status);
                // Udany request fetch (prognoza)
                console.log('FETCH JEST OK', forecastUrl, 'status:', response.status);
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
                    descEl.textContent = `${name}, ${country}`;

                    //aktualna pogoda
                    var weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=pl`;
                    return xhrPromise(weatherUrl);
                })
                .then(function (weatherData) {
                    console.log('Pogoda:', weatherData);
                    updateUI(weatherData);

                    //5-dniowa prognoza
                    return fetchForecastData(coords.lat, coords.lon);
                })
                .then(function (forecastData) {
                    console.log('Prognoza 5-dniowa:', forecastData);
                    updateUI(forecastData);
                })
                .catch(function (error) {
                    console.error(error);
                    descEl.textContent = error.message;
                });
        });
    }

});