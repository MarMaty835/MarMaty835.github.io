import { glMatrix, mat4, vec3 } from 'gl-matrix';




let gl;
let startTime;

function initGL(canvas) {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    gl.enable(gl.CULL_FACE);    
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
let WVPloc;

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
    WVPloc = gl.getUniformLocation(program, "MatrWVP");
}
/*
    let h = 0.5 + Math.cos(Math.acos(-Math.sqrt(5) / 3) - Math.PI / 2);
    vertices = [];

    for (let i = 0; i < 5; i++)
    {
        vertices.push(Math.sin(i / 5 * Math.PI * 2), 0.5, Math.cos(i / 5 * Math.PI * 2));
        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        
        vertices.push(Math.sin(i / 5 * Math.PI * 2), 0.5, Math.cos(i / 5 * Math.PI * 2));
        vertices.push(0, h, 0);
        
        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(0, -h, 0);

        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2));

        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2), 0.5, Math.cos((i + 1) / 5 * Math.PI * 2));

        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2), 0.5, Math.cos((i + 1) / 5 * Math.PI * 2));
        vertices.push(Math.sin((i + 2) / 5 * Math.PI * 2), 0.5, Math.cos((i + 2) / 5 * Math.PI * 2));

        nov += 12;
    }
*/
let nov = 0;
let vertexBuffer, vertices;
function initBuffer() {

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //vertices = [-1, -1, 0, 1, -1, 0, 1, 1, 0, 1, 1, 0, -1, 1, 0, -1, -1,  0];

    let h = 0.5 + Math.cos(Math.acos(-Math.sqrt(5) / 3) - Math.PI / 2);
    vertices = [];

    for (let i = 0; i < 5; i++)
    {
        vertices.push(Math.sin(i / 5 * Math.PI * 2), 0.5, Math.cos(i / 5 * Math.PI * 2));
        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2), 0.5, Math.cos((i + 1) / 5 * Math.PI * 2));
        

        vertices.push(Math.sin(i / 5 * Math.PI * 2), 0.5, Math.cos(i / 5 * Math.PI * 2));
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2), 0.5, Math.cos((i + 1) / 5 * Math.PI * 2));
        vertices.push(0, h, 0);
        

        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2), 0.5, Math.cos((i + 1) / 5 * Math.PI * 2));
        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2));
        
        vertices.push(Math.sin((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos((i + 1) / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(Math.sin(i / 5 * Math.PI * 2 + Math.PI * 0.2), -0.5, Math.cos(i / 5 * Math.PI * 2 + Math.PI * 0.2));
        vertices.push(0, -h, 0);

        nov += 12;
    }
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );
    
}

let rot = mat4.create();
let MatrWVP = mat4.create();
let mi = mat4.create();
let timeFromStart;


function drawScene() {
    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    timeFromStart = new Date().getMilliseconds() - startTime;
    gl.uniform1f(u_time_location, timeFromStart / 1000.0);
    rot = mat4.rotateX(rot, mi, FY * 0.005);
    rot = mat4.rotateY(rot, rot, FX * 0.005);
    gl.uniformMatrix4fv(WVPloc, false, mat4.multiply(MatrWVP, MatrVP, rot));

    gl.drawArrays(gl.LINES, 0, nov);
    window.requestAnimationFrame(drawScene);
}

let FX = 0, FY = 0;
let My, Mx;
let IsMouseDown;
let MatrProj, MatrVP;

export function onStart() {
    let canvas = document.getElementById("webgl-canvas");
    let asp;


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
            FX += (ev.x - Mx);
            FY += (ev.y - My);
            Mx = ev.x;
            My = ev.y;
            console.log(`FX = ${FX},FY = ${FY}`);
        }
    };

    /* Correct aspect ratio */
    if (canvas.width >= canvas.height)
        asp = canvas.width / canvas.height;
    else
        asp = canvas.height / canvas.width;

    let a = mat4.create();
    MatrProj = mat4.create();
    mat4.perspective(MatrProj, 3.1415 / 2, asp, 0.1, 1000);
    MatrVP = mat4.create();
    MatrVP = mat4.multiply(MatrVP, MatrProj, mat4.lookAt(a, vec3.set(vec3.create(), 0, 0, 3), vec3.set(vec3.create(), 0, 0, 0), vec3.set(vec3.create(), 0, 1, 0)));
  
    initGL(canvas);
    /*fetch('res/figure.vert')
        .then(response => response.text())
        .then(text => shaderVs = text)
        .then(() => fetch('res/figure.frag')
            .then(response => response.text()))
            .then(text => shaderFs = text)
            .then(() => initShaders());*/
    shaderFs = 
    `#version 300 es
    precision highp float;
    layout (location = 0) out vec4 o_color;

    uniform float u_time;
    in vec3 col;



    void main() {
        o_color = vec4(col, 1);
    }
    `
    shaderVs = 
    `#version 300 es
    precision highp float;
    

    layout (location = 0) in vec3 a_pos;
    out vec3 col;

    uniform mat4 MatrWVP;
    uniform float u_time;   
    void main() {
        col = normalize(vec3(abs(a_pos.x), abs(a_pos.y), abs(a_pos.z)));
        gl_Position = MatrWVP * vec4(a_pos, 1);
    }
    `
    initShaders();
    
    initBuffer();

    startTime = new Date().getMilliseconds();
    drawScene();
}
