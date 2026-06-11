/* rigid_body structure:
 * 2x vec2 OBB
 * flt width height
 * 1x vec2 position
 * 1x flt mass
 * 1x vec2 velocity
 */
import { glMatrix, vec2 } from 'gl-matrix';
import * as engine from './engine.js';



let DeltaTime = 0;
let Time = 0;
let dummyVec2 = vec2.create();

function TimerResponse(){
    let t = performance.now() / 1000.0;
    DeltaTime = t - Time;
    Time = t;
}

let gl;

function initGL(canvas) {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

let shaderFs, shaderVs;

function getShader(shaderStr, type) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, shaderStr);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
    }

    return shader;
}

let u_time_location;
let FXloc, FYloc;
let ZXloc, ZYloc, Zloc;

function initShaders() {

    const vs = getShader(shaderFs, gl.FRAGMENT_SHADER);
    const fs = getShader(shaderVs, gl.VERTEX_SHADER);

        
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Program linkage error");
    }

    gl.useProgram(program);

    u_time_location = gl.getUniformLocation(program, "u_time");
    FXloc = gl.getUniformLocation(program, "FX");
    FYloc = gl.getUniformLocation(program, "FY");
    ZXloc = gl.getUniformLocation(program, "ZX");
    ZYloc = gl.getUniformLocation(program, "ZY");
    Zloc = gl.getUniformLocation(program, "Zoom");
}

let vertexBuffer, vertices = [];
function initBuffer() {
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );
}

function drawScene() {
    engine.response();
    gl.clearColor(0, 1, 0, 1);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    timeFromStart = new Date().getMilliseconds() - startTime;
    gl.uniform1f(u_time_location, timeFromStart / 1000.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(drawScene);
}

export function onStart() {
    let canvas = document.getElementById("webgl-canvas");

    CreateRectangle();

    initGL(canvas);
    fetch('res/fractal.vert')
        .then(response => response.text())
        .then(text => shaderVs = text)
        .then(() => fetch('res/fractal.frag')
            .then(response => response.text()))
            .then(text => shaderFs = text)
            .then(() => initShaders());
    
    initBuffer();

    startTime = new Date().getMilliseconds();
    drawScene();
}

function CreateRectangle() {
    let body = engine.createBody(ec2.set(dummyVec2, 0, 0), 100, 100, 100);
    vertices = [50, 50, 50, -50, -50, -50, -50, 50];
    initBuffer();
}

window.onload = onStart();