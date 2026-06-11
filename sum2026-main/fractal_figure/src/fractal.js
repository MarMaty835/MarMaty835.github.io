
let gl;
let startTime;
let FX = 0.0, FY = 0.0;
let ZX = 0.0, ZY = 0.0;
let Zoom = 1;
let Mx, My;
let isbut

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

let vertexBuffer, vertices;
function initBuffer() {
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    vertices = [-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );
}

let timeFromStart;

function drawScene() {
    gl.clearColor(0, 1, 0, 1);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    timeFromStart = new Date().getMilliseconds() - startTime;
    gl.uniform1f(u_time_location, timeFromStart / 1000.0);
    gl.uniform1f(FXloc, FX);
    gl.uniform1f(FYloc, FY);
    gl.uniform1f(ZXloc, ZX);
    gl.uniform1f(ZYloc, ZY);
    gl.uniform1f(Zloc, Zoom);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(drawScene);
}

let IsMouseDown = false;
let IsMouseIn = false;
export function onStart() {
    let canvas = document.getElementById("webgl-canvas");


    canvas.onmousedown = (ev) => {
        IsMouseDown = true;
        Mx = ev.x;
        My = ev.y;
    }
    canvas.onmouseup = (ev) => {
        IsMouseDown = false;
    }
    canvas.onmouseleave = (ev) => {
        IsMouseDown = false;
    }
    canvas.onmousemove = (ev) => {
        if (IsMouseDown)
        {
            FX += (ev.x - Mx) * Zoom;
            FY += (ev.y - My) * Zoom;
            Mx = ev.x;
            My = ev.y;
            console.log(`FX = ${FX},FY = ${FY}`);
        }
    };
    canvas.onwheel = (ev) => {  
        FX += ev.x * ev.deltaY * 0.001 * Zoom;
        FY -= (canvas.height - ev.y) * ev.deltaY * 0.001 * Zoom;
        Zoom += ev.deltaY * 0.001 * Zoom;
        console.log(`Zoom = ${ev.clientY}`);
    };

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
