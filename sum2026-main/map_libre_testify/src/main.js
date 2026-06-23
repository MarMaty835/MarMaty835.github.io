import * as maplibregl from 'maplibre-gl'

let names = [], helps = [];
let namesTrigs = [];
const tit = document.getElementById('tit');
const arm = document.getElementById('arm');
const des = document.getElementById('des');
const lat = document.getElementById('lat');
const lng = document.getElementById('lng');
const pop = document.getElementById('pop');
const dat = document.getElementById('dat');
const helpVars = document.getElementById('helpvars');
const pushButton = document.getElementById('pushback');
const inputString = document.getElementById('searchString');

const map = new maplibregl.Map({
container: 'map',
style: 'https://demotiles.maplibre.org/style.json',//'https://tiles.openfreemap.org/styles/liberty',
center: [-74.5, 40],
zoom: 9,
renderWorldCopies: false
});
let isDrag = false;
let DragName = "";
let oldLngLat;
map.on("load", () => {
    map.on("mousemove", (ev) => {
        if (!isDrag) 
            return;
        const dx = ev.lngLat.lng - oldLngLat.lng;
        const dy = ev.lngLat.lat - oldLngLat.lat;
        movePolygonVertices(DragName, dx, dy, ev.lngLat);
        oldLngLat = ev.lngLat;
    })
    map.on("mouseup", (ev) => isDrag = false);

    load();

    pushButton.onclick = () => backPolygonVertices(DragName);
    inputString.oninput = () => inputResponse();
})
        
function inputResponse() {
    helpVars.innerHTML = `<li class="suggestion-item">
            <span class="suggestion-text">Думаю...</span>
            </li>`;
    helpsResponse();
}

async function helpsResponse() {
    helps = getValues(inputString.value);
    helpVars.innerHTML = '';
    if (helps.length == 0)
        helpVars.innerHTML = `<li class="suggestion-item">
            <span class="suggestion-text">Не знаю</span>
            </li>`;
    for (let i = 0; i < helps.length; i++)
        helpVars.innerHTML += `<li class="suggestion-item">
            <span class="suggestion-text" id="help${i}">${helps[i].name}</span>
            </li>`;
    for (let i = 0; i < helps.length; i++)
    {
        const el = document.getElementById(`help${i}`);
        el.onmousedown = () => pick(helps[i].name);
    }
}
function backPolygonVertices(sourceId) {
    const source = map.getSource(sourceId);
    const data = source._data.geojson;
    moveCoords(data, -data.properties.center[0] + data.properties.loc[0], -data.properties.center[1] + data.properties.loc[1]);
    source.setData(data);
}

function pick(name)
{
    const city = map.getSource(name);
    const source = city._data.geojson;

    if (DragName != "")
        deHighlight(DragName);
    DragName = `${source.properties.name}`;
    highlight(DragName);
    
    tit.textContent = `${source.properties.name}` ?? "Информация отсутствует";
    des.textContent = `${source.properties.descr}` ?? "Информация отсутствует";
    lat.textContent = `${source.properties.loc[1]}` ?? "Информация отсутствует";
    lng.textContent = `${source.properties.loc[0]}` ?? "Информация отсутствует";
    pop.textContent = `${source.properties.population}` ?? "Информация отсутствует";
    dat.textContent = `${source.properties.founded}` ?? "Информация отсутствует";
    if (dat.textContent == "undefined")
        dat.textContent = "Информация отсутствует";
    
    arm.src = source.properties.arm ?? "ico.jpg";

    map.flyTo({
        center: source.properties.center,
        zoom: 8,          
        speed: 1.2,        
        curve: 0.5,       
        essential: true    
    });
}
    
function movePolygonVertices(sourceId, dx, dy) {
    const source = map.getSource(sourceId);
    const data = source._data.geojson;
    moveCoords(data, dx, dy);
    source.setData(data);
}

function trigramInit()
{
    for (let i = 0; i < names.length; i++)
        namesTrigs.push({"name": names[i], "trigs": trigramisate(names[i])});
}

function trigramisate(str)
{
    str = str.toLowerCase();
    let trigs = [];

    for (let i = 0; i < str.length - 2; i++)
        trigs.push(str.slice(i, i + 3));

    return trigs;
}

function getValues(inp)
{
    inp = inp.toLowerCase();
    let vals = [];

    for (let i = 0; i < namesTrigs.length; i++)
    {
        let val = {"name": namesTrigs[i].name, "value": 0}
        if (val.name.slice(0, inp.length).toLowerCase() == inp)
            val.value += 10;
        val.value += getTrigValue(namesTrigs[i].trigs, trigramisate(inp));
        if (val.value > 0)
            vals.push(val);
    }

    return vals.sort((a, b) => b.value - a.value);;
}

function getTrigValue(dist, src)
{   
    dist = [...dist];
    let val = 0;
    
    for (let i = 0; i < src.length; i++)
        for (let j = 0; j < dist.length; j++)
        {
            if (src[i] == dist[j])
            {
                val += 3 * (1 / (1 + Math.abs(i - j) * 0.00001));
                dist.splice(j, 1);
                break
            }
        }

    return val;
}

function highlight(Name)
{
    map.setPaintProperty(Name, 'fill-outline-color', "#ff0000");
}

function deHighlight(Name)
{
    map.setPaintProperty(Name, 'fill-outline-color', "#55555500");
}

function moveCoords(feature, deltaX, deltaY) {
    if (feature.geometry.type == 'MultiPolygon')
    {
            feature.geometry.coordinates.forEach(polygon => {
            polygon.forEach((ring) => {
                ring.forEach((coord) => {
                    let dAng = (coord[0] - feature.properties.center[0]);
                    coord[0] += deltaX + Math.cos(coord[1] / 180 * Math.PI) * dAng / Math.cos((coord[1] + deltaY) / 180 * Math.PI) - dAng;
                    coord[1] += deltaY;
                });
            });
        });
    }
    feature.properties.center[0] += deltaX;
    feature.properties.center[1] += deltaY;
}
async function load() {
    const response = await fetch('data.geojson')
    const buf = await response.arrayBuffer();
    const decoder = new TextDecoder("windows-1251")
    const geojson = JSON.parse(decoder.decode(buf));
    
    for (let i = 0; i < geojson.features.length; i++)
    {
        const g = Math.random() * 255;
        const b = Math.random() * 255;
        if (geojson.features[i].properties.founded != undefined && geojson.features[i].properties.founded.at(0) == "+")
            geojson.features[i].properties.founded = geojson.features[i].properties.founded.slice(1, 5);
        map.addSource(`${geojson.features[i].properties.name}`, {'type': "geojson", 'data': geojson.features[i]})
        map.addLayer({
        'id': `${geojson.features[i].properties.name}`,
        'type': 'fill',
        'source': `${geojson.features[i].properties.name}`,
        'layout': {},
        'paint': {
        'fill-color': `rgb(0, ${g}, ${b})`,
        'fill-opacity': 0.8
        }})
        
        names.push(geojson.features[i].properties.name);
        map.on('mousedown', `${geojson.features[i].properties.name}`, (ev) => {
            isDrag = true;
            if (DragName != "")
                deHighlight(DragName);
            DragName = `${geojson.features[i].properties.name}`;
            highlight(DragName);
            oldLngLat = ev.lngLat;
            ev.preventDefault();
            
            tit.textContent = `${geojson.features[i].properties.name}` ?? "Информация отсутствует";
            des.textContent = `${geojson.features[i].properties.descr}` ?? "Информация отсутствует";
            lat.textContent = `${geojson.features[i].properties.loc[1]}` ?? "Информация отсутствует";
            lng.textContent = `${geojson.features[i].properties.loc[0]}` ?? "Информация отсутствует";
            pop.textContent = `${geojson.features[i].properties.population}` ?? "Информация отсутствует";
            dat.textContent = `${geojson.features[i].properties.founded}` ?? "Информация отсутствует";
            if (dat.textContent == "undefined")
                dat.textContent = "Информация отсутствует";
            
            arm.src = geojson.features[i].properties.arm ?? "ico.jpg";
        });
    }
    trigramInit();
    inputResponse();
    document.getElementById("schbtn").onclick = () => {if (helps[0] != undefined) pick(helps[0].name);};
    pick("Москва");
    console.log(JSON.stringify(geojson));
}