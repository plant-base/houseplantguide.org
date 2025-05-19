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


const a = L.geoJson(adansonii_data, {
    style: {
        fillOpacity: 0,
        color: '#0280ff',
        opacity: 1.0,
        weight: 3,
    },
}).addTo(map);

const b = L.geoJson(blanchetii_data, {
    style: {
        fillOpacity: 0,
        color: '#ff8f4b',
        opacity: 1.0,
        weight: 3,
    },
}).addTo(map);


const legend = L.control({position: 'bottomright'});

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    L.DomUtil.addClass(div, 'background');
    L.DomUtil.addClass(div, 'rounded');
    L.DomUtil.addClass(div, 'outline');

    const labels = [];
    labels.push(`<h4>Legend</h4>`);
    labels.push(`<div><i class="circle" style="background:#5aa7ff"></i> adansonii</div>`);
    labels.push(`<div><i class="circle" style="background:#ff8f4b"></i> blanchetii</div>`);
    div.innerHTML = labels.join('');
    return div;
};

legend.addTo(map);

var bounds1 = a.getBounds();
var bounds2 = b.getBounds();

map.fitBounds(bounds1.extend(bounds2));
