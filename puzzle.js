document.addEventListener("DOMContentLoaded", function () {
    // Initialize Leaflet map
    console.log("I DECLARE BANKRUPTCY!");
    const start_coords = [53.430127, 14.564802];
    const map = L.map('map').setView(start_coords, 18);
    L.tileLayer.provider('Esri.WorldStreetMap').addTo(map);

    const marker = L.marker(start_coords).addTo(map);
    marker.setLatLng(start_coords);

    //basically rozwiązanie jest takie, że robimy 16 divów-dzieci, każdy jest draggable, każdy div ma id,
    //jeśli wszystkie id matchują to daj powiadomienie
    function buildPuzzle(srcCanvas) {
        const w = srcCanvas.width;
        const h = srcCanvas.height;

        const piecesContainer = document.getElementById("puzzlePieces");
        const solutionContainer = document.getElementById("solutionTable");
        if (!piecesContainer || !solutionContainer) return;

        // Wyczyść poprzednią zawartość
        piecesContainer.innerHTML = "";
        solutionContainer.innerHTML = "";

        const cols = 4, rows = 4;

        // Ustal równą wielkość kafli (ucięcie nadmiaru kilku pikseli)
        const tileW = Math.floor(w / cols);
        const tileH = Math.floor(h / rows);

        const effectiveW = tileW * cols;
        const effectiveH = tileH * rows;

        // Dopasuj rozmiary kontenerów
        [piecesContainer, solutionContainer].forEach(c => {
            c.style.width = effectiveW + "px";
            c.style.height = effectiveH + "px";
            c.style.display = "grid";
            c.style.gridTemplateColumns = `repeat(${cols}, ${tileW}px)`;
            c.style.gridTemplateRows = `repeat(${rows}, ${tileH}px)`;
            c.style.gap = "0";
        });

        // Funkcja sprawdzająca czy puzzle są poprawnie ułożone (wszystkie sloty zajęte właściwym elementem)
        function checkPuzzleSolved() {
            const slots = solutionContainer.querySelectorAll(".puzzle-slot");
            if (!slots.length) return false;
            let total = 0;
            for (const slot of slots) {
                const piece = slot.querySelector(".puzzle-piece");
                if (!piece) return false; // pusty slot
                if (piece.dataset.origIndex !== slot.dataset.targetIndex) return false; // zły element w slocie
                total++;
                console.log("Poprawnie ułożone puzzle: " + total + " / " + slots.length + "");

            }
            // jeżeli wszystkie poprawne, powiadom
            notifyMe();
            return true;
        }

        // Zbuduj w solutionContainer 16 dedykowanych slotów na elementy
        const total = cols * rows;
        for (let i = 0; i < total; i++) {
            const slot = document.createElement("div");
            slot.className = "puzzle-slot";
            slot.id = "slot-" + i;
            slot.dataset.targetIndex = String(i);
            slot.style.width = tileW + "px";
            slot.style.height = tileH + "px";
            // obsługa DnD dla slotów
            slot.addEventListener("dragover", e => e.preventDefault());
            slot.addEventListener("drop", e => {
                e.preventDefault();
                const pieceId = e.dataTransfer.getData("text/plain");
                const fromId = e.dataTransfer.getData("fromId");
                const piece = document.getElementById(pieceId);
                if (!piece) return;

                // jeśli upuszczamy na ten sam slot nic nie rób
                if (piece.parentElement === slot) return;

                const existing = slot.querySelector(".puzzle-piece");
                // przenieś nowy element do slotu
                slot.innerHTML = "";
                slot.appendChild(piece);

                // jeśli był element, odłóż go na źródło
                if (existing) {
                    const fromEl = fromId ? document.getElementById(fromId) : null;
                    if (fromEl) {
                        fromEl.appendChild(existing);
                    } else {
                        piecesContainer.appendChild(existing);
                    }
                }

                // po każdym dropie sprawdź czy układ rozwiązany
                checkPuzzleSolved();
            });
            solutionContainer.appendChild(slot);
        }

        // Przygotuj źródłowe fragmenty
        const srcRects = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                srcRects.push({
                    sx: c * tileW,
                    sy: r * tileH,
                    sw: tileW,
                    sh: tileH
                });
            }
        }

        // Stwórz płótna dla każdego puzzla
        const pieces = srcRects.map((s, idx) => {
            const tile = document.createElement("canvas");
            tile.width = tileW;
            tile.height = tileH;
            tile.style.width = tileW + "px";
            tile.style.height = tileH + "px";
            tile.className = "puzzle-piece";
            tile.id = "piece-" + idx;
            tile.setAttribute("draggable", "true");
            tile.dataset.origIndex = String(idx);

            const tctx = tile.getContext("2d");
            tctx.drawImage(srcCanvas, s.sx, s.sy, s.sw, s.sh, 0, 0, tileW, tileH);
            return tile;
        });

        const indices = pieces.map((_, i) => i)
            .sort(() => Math.random() - Math.random());

        // Dodaj puzzle w losowej kolejności
        indices.forEach(i => piecesContainer.appendChild(pieces[i]));

        // Obsługa drag & drop
        function setupPieceDrag(el) {
            el.addEventListener("dragstart", e => {
                el.style.opacity = "0.6";
                e.dataTransfer.setData("text/plain", el.id);
                const parentId = el.parentElement ? el.parentElement.id : "";
                e.dataTransfer.setData("fromId", parentId);
            });
            el.addEventListener("dragend", () => {
                el.style.opacity = "1";
            });
        }
        pieces.forEach(setupPieceDrag);

        // Drop target: kontener z losowymi elementami (magazyn)
        piecesContainer.addEventListener("dragover", e => e.preventDefault());
        piecesContainer.addEventListener("drop", e => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain");
            const node = document.getElementById(id);
            if (!node) return;

            // jeśli pochodził ze slotu, wyczyść slot (usunięcie przez append samo odkleja)
            piecesContainer.appendChild(node);
        });
    }
    function notifyMe() {
        if (!("Notification" in window)) {
            // Check if the browser supports notifications
            alert("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            // Check whether notification permissions have already been granted;
            // if so, create a notification
            const notification = new Notification("Puzzle rozwiązane!");
            // …
        } else if (Notification.permission !== "denied") {
            // We need to ask the user for permission
            Notification.requestPermission().then((permission) => {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    const notification = new Notification("Puzzle rozwiązane!");
                    // …
                }
            });
        }

        // At last, if the user has denied notifications, and you
        // want to be respectful there is no need to bother them anymore.
    }
    // Save exactly the current map view without changing user's position
    const saveBtn = document.getElementById("saveButton");
    if (saveBtn) {
        saveBtn.addEventListener("click", function () {
            leafletImage(map, function (err, srcCanvas) {
                if (err) {
                    console.error(err);
                    return;
                }
                const rasterMap = document.getElementById("rasterMap");
                const w = srcCanvas.width;
                const h = srcCanvas.height;
                rasterMap.width = w;
                rasterMap.height = h;
                rasterMap.style.width = w + "px";
                rasterMap.style.height = h + "px";

                const ctx = rasterMap.getContext("2d");
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(srcCanvas, 0, 0);

                // Build 4x4 draggable puzzle pieces from the saved raster into the left grid
                buildPuzzle(srcCanvas);
            });
        });
    }

    //popup i zmiana mapy
    const getLocBtn = document.querySelector(".getLocation");
    if (getLocBtn) {
        getLocBtn.addEventListener("click", function () {
            if (!navigator.geolocation) {
                console.log("No geolocation.");
                return;
            }
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                marker.setLatLng([lat, lon]);
                marker.bindPopup(`<strong>Tu jesteś!</strong><br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
                map.setView([lat, lon]);
            }, positionError => {
                console.error(positionError);
            });
        });
    }
});