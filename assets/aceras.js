/*jshint esversion: 6 */
(function () {
    'use strict';

    if (location.protocol !== 'https:') {
        location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoianVhbmpvc2VjYWJyZXJhIiwiYSI6ImNrOWNqejVmeTAwMjIzbW50eXlnZTY4NTMifQ.SL_TYhDFNLnInd3fSwAUVg';

    let map;

    const
        colors = ["#f0f921", "#fccf25", "#fca437", "#f07f4f", "#d9596a", "#ba3388", "#8d0ba5", "#5402a3", "#0d0887"],
        breaks = [1.5, 2.1, 2.7, 3.4, 4.3, 5.3, 6.8, 10, 200.8],
        init = () => {
            const
                polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
                    let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                    return {
                        x: centerX + (radius * Math.cos(angleInRadians)),
                        y: centerY + (radius * Math.sin(angleInRadians))
                    };
                },
                describeArc = (x, y, radius, startAngle, endAngle) => {
                    let
                        start = polarToCartesian(x, y, radius, endAngle),
                        end = polarToCartesian(x, y, radius, startAngle),
                        largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1",
                        d = [
                            "M", start.x, start.y,
                            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
                        ].join(" ");
                    return d;
                },
                newdata = () => {
                    const histogram = (data, bins) => {
                        let
                            length = data.length,
                            min = Math.min(...data),
                            max = Math.max(...data),
                            size = (max - min) / bins,
                            h = Array(bins).fill(0);
                        data.forEach(d => { h[Math.floor((d - min) / size)]++; });
                        return h;
                    };
                    let
                        ctrl = document.querySelector('.valor'),
                        tick = document.getElementById("tick"),
                        r = document.querySelector('.dataviewcontrol').offsetHeight / 2,
                        data = map.queryRenderedFeatures({ layers: ['aceras.acerasvoro'] }).map(b => b.properties.width * 1),
                        avg = Math.round(10 * data.reduce((a, b) => a + b, 0) / data.length) / 10,
                        b = breaks.map((b, i) => (b > avg) ? i : -1).filter(k => k > -1)[0],
                        color = colors[b];
                    if (isNaN(avg)) {
                        ctrl.style.color = '#666';
                        ctrl.textContent = `-`;
                        tick.setAttribute("d", describeArc(r, r, r - 12, 0, 0));
                    } else {
                        ctrl.style.color = color;
                        ctrl.textContent = `${avg} m`;
                        tick.setAttribute("d", describeArc(r, r, r - 12, (20 * b) - 80, (20 * b) - 77));
                    }
                },
                legend = document.createElementNS("http://www.w3.org/2000/svg", "svg");

            map = new mapboxgl.Map({
                container: 'map',
                'style': 'mapbox://styles/mapbox/dark-v10',
                'center': [-3.703793, 40.416687],
                'zoom': 15,
                'minZoom': 14,
                'attributionControl': false,
                'dragRotate': false,
                'pitchWithRotate': false,
                'locale': 'es',
                'language': "es",
                'maxBounds': [-3.889, 40.312, -3.5179, 40.6437]
            });
            map.touchZoomRotate.disableRotation();

            map.on('load', function () {
                window._map = map;
                map.addControl(
                    new MapboxDirections({
                        accessToken: mapboxgl.accessToken,
                        unit: 'metric',
                        profile: 'mapbox/walking',
                        language: 'es',
                        interactive: false,
                        alternatives: true,
                        controls: {
                            profileSwitcher: false
                        },
                        geocoder: {
                            language: "es"
                        },
                        placeholderDestination: "Elige el destino",
                        placeholderOrigin: "Elige el punto de origen"
                    }),
                    'top-left'
                );
                map.addControl(new mapboxgl.NavigationControl({ 'showCompass': false }), 'top-right');
                map.addControl(
                    new MapboxGeocoder({
                        accessToken: mapboxgl.accessToken,
                        mapboxgl: mapboxgl,
                        placeholder: ' ',
                        collapsed: true,
                        language: "es",
                        countries: 'es',
                        bbox: [-3.889, 40.312, -3.5179, 40.6437]
                    }),
                    'bottom-left'
                );
                map.addLayer({
                    id: 'aceras.acerasvoro',
                    type: 'fill',
                    source: {
                        type: 'vector',
                        url: 'assets/aceras.acerasvoro.json'
                    },
                    'source-layer': 'aceras',
                    "paint": {
                        "fill-color": [
                            'interpolate-lab',
                            ['linear'],
                            ["to-number", ['get', 'width']],
                            breaks[0], colors[0],
                            breaks[1], colors[1],
                            breaks[2], colors[2],
                            breaks[3], colors[3],
                            breaks[4], colors[4],
                            breaks[5], colors[5],
                            breaks[6], colors[6],
                            breaks[7], colors[7],
                            breaks[8], colors[8]
                        ],
                        "fill-opacity": 1,
                        "fill-outline-color": [
                            'interpolate-lab',
                            ['linear'],
                            ["to-number", ['get', 'width']],
                            breaks[0], colors[0],
                            breaks[1], colors[1],
                            breaks[2], colors[2],
                            breaks[3], colors[3],
                            breaks[4], colors[4],
                            breaks[5], colors[5],
                            breaks[6], colors[6],
                            breaks[7], colors[7],
                            breaks[8], colors[8]
                        ]
                    }
                });

                // ------------------------------------------------------------------

                map.addLayer(
                    {
                        'id': '3d-buildings',
                        'source': 'composite',
                        'source-layer': 'building',
                        'filter': ['==', 'extrude', 'true'],
                        'type': 'fill-extrusion',
                        'minzoom': 15,
                        'paint': {
                            'fill-extrusion-color': '#111',
                            'fill-extrusion-height': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                15,
                                0,
                                15.05,
                                ['get', 'height']
                            ],
                            'fill-extrusion-base': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                15,
                                0,
                                15.05,
                                ['get', 'min_height']
                            ],
                            'fill-extrusion-opacity': 0.7
                        }
                    }
                );

                // -------------------------------------------------------------------

                class dataviewcontrol {
                    onAdd(map) {
                        this.map = map;
                        this.container = document.createElement('div');
                        this.container.className = 'dataviewcontrol';
                        this.container.innerHTML = `<div class="titol">ancho</div><div class="valor">-</div><div class="titol">medio</div><div class="min">0.1</div><div class="max">${Math.round(breaks[8])}</div>`;
                        return this.container;
                    }
                    onRemove() {
                        this.container.parentNode.removeChild(this.container);
                        this.map = undefined;
                    }
                }
                const dataview = new dataviewcontrol();
                map.addControl(dataview, 'bottom-right');
                document.querySelector('.dataviewcontrol').appendChild(legend);
                colors.forEach((a, i) => {
                    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute('id', `arc_${i}`);
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', a);
                    path.setAttribute('stroke-width', 5);
                    legend.appendChild(path);
                });
                let tick = document.createElementNS("http://www.w3.org/2000/svg", "path");
                tick.setAttribute('id', `tick`);
                tick.setAttribute('fill', 'none');
                tick.setAttribute('stroke', '#dddddd');
                tick.setAttribute('stroke-width', 3);
                legend.appendChild(tick);
                let r = document.querySelector('.dataviewcontrol').offsetHeight / 2;
                breaks.forEach((a, i) => {
                    let path = document.querySelector(`#arc_${i}`);
                    path.setAttribute("d", describeArc(r, r, r - 5, (20 * i) - 90.5, (20 * (i + 1)) - 89.5));
                });

                map.on('idle', newdata);

                let
                    popup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        className: 'classnight'
                    }).trackPointer(),
                    shpp = e => {
                        if (e.features.length > 0) {
                            map.getCanvas().style.cursor = 'pointer';
                            let width = e.features[0].properties.width * 1;
                            popup.setHTML(`<div class="pval">${width}m</div>
                        <div class="icons">
                        <div class="dist  ${(width >= 3.5) ? '' : 'red'}"></div>
                        <div class="distk  ${(width >= 4) ? '' : 'red'}">
                        </div><div class="distk2 ${(width >= 4.5) ? '' : 'red'}"></div>
                        </div>`);
                            if (!popup.isOpen()) popup.addTo(map);
                        }
                    };
                map.on('mousemove', 'aceras.acerasvoro', shpp);

                map.on('mouseleave', 'aceras.acerasvoro', function (e) {
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                });

                map.on('dragstart', 'aceras.acerasvoro', function (e) {
                    map.off('mousemove', 'aceras.acerasvoro', shpp);
                    popup.remove();
                });

                map.on('dragend', 'aceras.acerasvoro', function (e) {
                    map.on('mousemove', 'aceras.acerasvoro', shpp);
                });

                document.querySelector(".lg2").addEventListener("click", () => { window.location.href = 'http://www.inspide.com' });

                map.resize();

            });
        };

    window.info_open = () => {
        document.getElementById("sidepanel").style.width = "100vw";
        document.querySelector(".sidecontent").style.width = "100%";
        document.querySelector(".lg2").style.display = "block";
    },
        window.info_close = () => {
            document.getElementById("sidepanel").style.width = "0px";
            document.querySelector(".sidecontent").style.width = "0px";
            document.querySelector(".lg2").style.display = "none";
        };

    document.addEventListener("DOMContentLoaded", init);

})();
