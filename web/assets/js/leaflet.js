const map = L.map('map',
    {
        attributionControl: false,
        zoomControl: true,
        minZoom: 1.0,
        maxZoom: 10.0,
        scrollWheelZoom: false
    }).setView([0.0, 0.0], 2);

const dark = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const light = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const tiles = L.tileLayer(light, {
    maxZoom: 10,
}).addTo(map);

function setMapTheme(theme) {
    //tiles.setUrl(theme === 'dark' ? dark : light);
}

// INFO PANEL
const info = L.control({position: 'bottomleft'});

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    L.DomUtil.addClass(this._div, 'foreground');
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
        fillColor: feature.properties.native ? '#7dbeff' : '#ffcca4',
        fillOpacity: 0.5,
        color: feature.properties.native ? '#3b89ff' : '#ff9366',
        opacity: 0.8,
        weight: 2,
    }
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 2,
        dashArray: '',
        fillOpacity: 0.7
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
    L.DomUtil.addClass(div, 'foreground');
    L.DomUtil.addClass(div, 'rounded');
    L.DomUtil.addClass(div, 'outline');


    const labels = [];
    labels.push(`<h4>Legend</h4>`);
    labels.push(`<div><i class="circle" style="background:#38abff"></i> Native</div>`);
    labels.push(`<div><i class="circle" style="background:#ff8f4b"></i> Introduced</div>`);
    div.innerHTML = labels.join('');
    return div;
};

legend.addTo(map);

// Fit to zones.
map.fitBounds(geojson.getBounds());
