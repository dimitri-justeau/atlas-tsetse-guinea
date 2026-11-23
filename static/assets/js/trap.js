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

var map = L.map(
    'map-trap', {
        zoomSnap: 0.25,
        zoomDelta: 0.25
    }).setView([10.0, -11.1], 7.5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var trap_path = root + "/" + asset_root + "/geojson/traps/" + current + ".geojson";
var trap_geojson = null;

fetch(trap_path)
    .then(response => response.json())
    .then(data => {
        function tooltip(feature, layer) {
            layer.bindTooltip(String("<b>" + feature.properties.code + "</b>: " + feature.properties.total_tsetse) +' mouches');
        }
        trap_geojson = L.geoJSON(data, {
            onEachFeature: tooltip,
        }).addTo(map);
        trap_geojson.bringToFront();
        map.fitBounds(trap_geojson.getBounds());

        let followUp = data.features[0].properties.follow_up;
        followUp = [{
            nb_female: data.features[0].properties.nb_female,
            nb_male: data.features[0].properties.nb_male,
            start_date: data.features[0].properties.start_date,
            total_tsetse: data.features[0].properties.total_tsetse
        }].concat(followUp);
        if (followUp.length > 0) {
            let chartData = {
                labels: followUp.map(({ start_date }) => start_date),
                datasets: [{
                    label: 'Nombre de femelles',
                    data: followUp.map(({ nb_female }) => nb_female),
                    backgroundColor: '#5B066D99',
                    borderColor: '#5B066D',
                    borderWidth: 1
                },
                {
                    label: 'Nombre de mâles',
                    data: followUp.map(({ nb_male }) => nb_male),
                    backgroundColor: '#0D6D0699',
                    borderColor: '#0D6D06',
                    borderWidth: 1
                }]
            };
            // Configuration options for the chart
            let options = {
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: true,
                        type: 'timeseries',
                        distribution: 'series',
                        time: {
                            unit: "",
                            displayFormats: {
                                day: 'dd/MM/yyyy'
                            }
                        }
                    },
                    y: {
                        stacked: true
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


