const map = L.map('map',
    {
        attributionControl: false,
        zoomControl: true,
        minZoom: 1.2,
        maxZoom: 10,
    }).setView([0.0, 0.0], 1);

const background = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

const tiles = L.tileLayer(background, {
    maxZoom: 10,
}).addTo(map);

function setMapTheme(theme) {
    console.log(theme)
    tiles.setUrl(theme === 'dark' ?
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' :
        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png');
}

// INFO PANEL
const info = L.control({position: 'bottomleft'});

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    L.DomUtil.addClass(this._div, 'background');
    L.DomUtil.addClass(this._div, 'rounded');
    L.DomUtil.addClass(this._div, 'outline');

    this.update();
    return this._div;
};

info.update = function (props) {
    const contents = props
        ? `<b>${props.tdwg_name}</b>`
        : 'Hover to see more information.';

    this._div.innerHTML = `<h4>Distribution zone</h4>${contents}`;
};

info.addTo(map);


function style(feature) {
    return {
        fillColor: feature.properties.native ? '#aaf6b3' : '#ffcca4',
        fillOpacity: 0.5,
        color: feature.properties.native ? '#7dc780' : '#ff9366',
        opacity: 0.5,
        weight: 2,
    }
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 0,
        dashArray: '',
        fillOpacity: 0.8
    });

    layer.bringToFront();

    info.update(layer.feature.properties);
}

/* global statesData */
const geojson = L.geoJson(data, {
    style,
    onEachFeature
}).addTo(map);

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    const layer = e.target;
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// LEGEND
const legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'legend');
    L.DomUtil.addClass(div, 'background');
    L.DomUtil.addClass(div, 'rounded');
    L.DomUtil.addClass(div, 'outline');


    const labels = [];
    labels.push(`<h4>Legend</h4>`);
    labels.push(`<div><i class="circle" style="background:#49d268"></i> Native</div>`);
    labels.push(`<div><i class="circle" style="background:#ff8f4b"></i> Introduced</div>`);
    div.innerHTML = labels.join('');
    return div;
};

legend.addTo(map);

// Fit to zones.
map.fitBounds(geojson.getBounds());
