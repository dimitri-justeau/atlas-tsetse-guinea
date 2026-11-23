$('.sidebar-toggle').on('click', function (e) {
  $('.app').toggleClass('is-collapsed');
  e.preventDefault();
});
/**
 * Wait untill sidebar fully toggled (animated in/out)
 * then trigger window resize event in order to recalculate
 * masonry layout widths and gutters.
 */
$('#sidebar-toggle').click(function (e) {
  e.preventDefault();
  setTimeout(function () {
    window.dispatchEvent(window.EVENT);
  }, 300);
});

var offset = $('#sidebar-container li').first().position().top;
$('#sidebar-container').scrollTop($('#' + current).position().top - offset);

var map = L.map(
    'map', {
        zoomSnap: 0.25,
        zoomDelta: 0.25
    }).setView([10.0, -11.1], 7.5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var prefecture_path = root + "/" + asset_root + "/geojson/prefectures/" + current + ".geojson";
var prefecture_geojson = null;
let singleTraps_geojson = null;
let followUpTraps_geojson = null;

fetch(prefecture_path)
    .then(response => response.json())
    .then(data => {
        prefecture_geojson = L.geoJSON(data).addTo(map);
        map.fitBounds(prefecture_geojson.getBounds());
        if (singleTraps_geojson != null) {
            singleTraps_geojson.bringToFront();
        }
        if (followUpTraps_geojson != null) {
            followUpTraps_geojson.bringToFront();
        }
    })
    .catch(error => console.error('Erreur lors du chargement du fichier GeoJSON :', error));

var prefecture_traps_path = root + "/" + asset_root + "/geojson/prefectures/" + current + "_traps.geojson";


fetch(prefecture_traps_path)
    .then(response => response.json())
    .then(data => {
        function tooltip(feature, layer) {
            let tooltip_label = feature.properties.latest_total + " mouches";
            if (feature.properties.latest_total == 1) {
                tooltip_label = feature.properties.latest_total + " mouche";
            }
            if (feature.properties.latest_total == 0) {
                tooltip_label = "Pas de mouches"
            }
            layer.bindTooltip(String("<b>" + feature.properties.code + "</b>: " + tooltip_label));
            layer.on({
                click: function(e) {
                    window.location.href = root + "/" + "traps/" + feature.properties.code + ".html";
                }
            });
        }
        let singleTraps = data.features.filter(f => f.properties.recurrent == false);
        let followUpTraps = data.features.filter(f => f.properties.recurrent == true);
        let classes = [0, 1, 5, 10, 15]
        let colorRamp = [
            chroma("#ffffff").alpha(0.7),
            chroma("#fecc5c").alpha(0.7),
            chroma("#fd8d3c").alpha(0.7),
            chroma("#f03b20").alpha(0.7),
            chroma("#bd0026").alpha(0.7)
        ]
        console.log(singleTraps);
        if (singleTraps.length <= 5 || followUpTraps.length <= 5) {
            classes = [0, 1, 10]
            colorRamp = [
                chroma("#ffffff").alpha(0.7),
                chroma("#feb24c").alpha(0.7),
                chroma("#f03b20").alpha(0.7)
            ]
        }
        if (singleTraps.length <= 3) {
            singleTraps = [singleTraps[0], singleTraps[0], singleTraps[0]];
        }
        if (singleTraps.length > 0) {
            singleTraps_geojson = L.dataClassification(singleTraps, {
                // required:
                mode: 'manual',
                classes: classes,
                field: 'latest_total',
                colorRamp: colorRamp,
                pointShape: "circle",
                legendTemplate: {
                    highest: '{low} mouches et plus',
                    middle: '{low} à {high} mouches',
                    lowest: 'Pas de capture',
                },
                legendTitle: 'Piégeage ponctuel',
                onEachFeature: tooltip,
            }).addTo(map);
            singleTraps_geojson.bringToFront();
        }
        if (followUpTraps.length > 0) {
            followUpTraps_geojson = L.dataClassification(followUpTraps, {
                // required:
                mode: 'manual',
                classes: classes,
                field: 'latest_total',
                colorRamp: colorRamp,
                pointShape: "diamond",
                legendTemplate: {
                    highest: '{low} mouches et plus',
                    middle: '{low} à {high} mouches',
                    lowest: 'Pas de capture',
                },
                legendTitle: 'Piégeage récurrent (dernière capture)',
                onEachFeature: tooltip,
            }).addTo(map);
            followUpTraps_geojson.bringToFront();
        }

        let catch_count = {};
        data.features.forEach((feat) => {
            feat.properties.all_catch_start_dates.forEach((date) => {
                let d = new Date(date);
                let monthYear = String(d.getMonth() + 1 + "-" + d.getFullYear());
                if (monthYear in catch_count) {
                    catch_count[monthYear] += 1;
                } else {
                    catch_count[monthYear] = 1;
                }
            });
        });
        if (Object.keys(catch_count).length > 0) {
            let chartData = {
                datasets: [{
                    label: 'Nombre de piègeages',
                    data: catch_count,
                    backgroundColor: '#5B066D99',
                    borderColor: '#5B066D',
                    borderWidth: 1
                },]
            };
            // Configuration options for the chart
            let options = {
                maintainAspectRatio: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            round: 'month',
                            parser: "M-yyyy",
                            tooltipFormat: "MM-yyyy"
                        }
                    }
                }
            };

            // Get the canvas element
            let ctx = document.getElementById('bar-chart')
                .getContext('2d');

            // Create the bar chart
            let myBarChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: options
            });
        }
    })
    .catch(error => console.error('Erreur lors du chargement du fichier GeoJSON :', error));
