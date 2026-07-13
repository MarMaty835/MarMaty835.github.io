let gl;
let startTime;
let FX = 0.0, FY = 0.0;
let ZX = 0.0, ZY = 0.0;
let Zoom = 1;
let Mx, My;
let isbut

function initGL(canvas) {
    gl = canvas.getContext("webgl2");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    FX = window.innerWidth;
    FY = window.innerHeight;
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
    gl.uniform1f(u_time_location, performance.now() / 1000.0);
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
            //FX += (ev.x - Mx) * Zoom;
            //FY += (ev.y - My) * Zoom;
            Mx = ev.x;
            My = ev.y;
            console.log(`FX = ${FX},FY = ${FY}`);
        }
    };
    canvas.onwheel = (ev) => {  
        //FX += ev.x * ev.deltaY * 0.001 * Zoom;
        //FY -= (canvas.height - ev.y) * ev.deltaY * 0.001 * Zoom;
        Zoom += ev.deltaY * 0.001 * Zoom;
        console.log(`Zoom = ${ev.clientY}`);
    };

    initGL(canvas);
    fetch('res/fractal.vert')
        .then(response => response.text())
        .then(text => shaderVs = text)
        .then(() => fetch('res/fractal.frag')
            .then(response => response.text()))
            .then(text => shaderFs = `#version 300 es
precision highp float;
layout (location = 0) out vec4 o_color;

uniform float u_time, FX, FY, ZX, ZY, Zoom;

struct RayHit {
    float dist;
    vec3 pos;
    vec3 normal;
};


// 1. Дискретное освещение (ступенчатое)
float toonShading(float value) {
    // Разбиваем на 3-4 уровня яркости
    if (value < 0.2) return 0.15;      // Тень
    if (value < 0.4) return 0.35;      // Полутень
    if (value < 0.6) return 0.55;      // Средний свет
    if (value < 0.8) return 0.75;      // Свет
    return 1.0;                         // Блик
}

// 2. Альтернативный вариант с плавными переходами
float toonShadingSmooth(float value) {
    // Используем floor для четких ступеней
    float steps = 4.0; // Количество уровней
    return floor(value * steps) / steps;
}

// 3. С контурными линиями (outline)
float getOutline(vec3 p, vec3 normal, vec3 viewDir) {
    // Чем больше угол между нормалью и взглядом - тем ближе к контуру
    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    rim = pow(rim, 2.0);
    
    // Резкий порог для контура
    return step(0.3, rim) * 0.5;
}

// 4. Полный селл-шейдинг цвет
vec3 celShadeColor(RayHit hit, vec3 baseColor, vec3 normal, vec3 lightDir, vec3 viewDir, float shadow) {
    // 1. Диффузное освещение с селл-шейдингом
    float diff = max(dot(normal, lightDir), 0.0);
    diff *= shadow; // Применяем тени
    
    // Дискретизация
    float toonDiff = toonShading(diff);
    
    // 2. Блик (Specular) - тоже дискретный
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    float toonSpec = step(0.5, spec) * 0.8; // Блик есть/нет
    
    // 3. Окружающее освещение (ambient)
    float ambient = 0.2;
    
    // 4. Контурные линии
    float outline = getOutline(hit.pos, hit.normal, viewDir);
    
    // Собираем цвет
    vec3 color = baseColor * (ambient + toonDiff * 0.8);
    color += vec3(1.0, 0.8, 0.9) * toonSpec;
    
    // Добавляем черные контуры
    color -= vec3(outline * 0.3);
    
    return color;
}

float sdHeart(vec3 p) {
    vec3 q = p;
    q.x = abs(q.x);
    
    float a = atan(q.x, q.y);
    float r = 0.75 + 0.25 * sin(a * 2.0);
    float d = length(vec2(q.x, q.y) - r * vec2(sin(a), cos(a)));
    
    // 3D объем
    return length(vec3(d, 0.0, q.z * 0.6)) - 0.1;
}

// ---------- Вращение объекта ----------
mat3 rotationMatrix(float angle, vec3 axis) {
    float c = cos(angle);
    float s = sin(angle);
    axis = normalize(axis);
    
    return mat3(
        c + (1.0 - c) * axis.x * axis.x,
        (1.0 - c) * axis.x * axis.y - s * axis.z,
        (1.0 - c) * axis.x * axis.z + s * axis.y,
        
        (1.0 - c) * axis.y * axis.x + s * axis.z,
        c + (1.0 - c) * axis.y * axis.y,
        (1.0 - c) * axis.y * axis.z - s * axis.x,
        
        (1.0 - c) * axis.z * axis.x - s * axis.y,
        (1.0 - c) * axis.z * axis.y + s * axis.x,
        c + (1.0 - c) * axis.z * axis.z
    );
}

// ---------- Сцена с сердцем ----------
float getSceneSDF(vec3 p) {
    // Вращаем сердце вокруг оси Y (красиво крутится)
    float angle = u_time * 0.5;
    mat3 rot = rotationMatrix(angle, vec3(0.0, 1.0, 0.0));
    
    // Также немного наклоняем
    mat3 rotX = rotationMatrix(sin(u_time * 0.3) * 0.2, vec3(1.0, 0.0, 0.0));
    
    vec3 heartPos = rot * rotX * p;
    
    // Смещаем сердце в центр сцены и немного вверх
    heartPos -= vec3(0.0, 0.2, 0.0);
    
    return sdHeart(heartPos);
}

// ---------- Остальные функции (нормали, тени, raymarching) ----------
// (Они такие же, как в прошлом примере, но я продублирую их для полноты)

float getShadow(vec3 ro, vec3 rd) {
    float t = 0.01;
    float maxDist = 20.0;
    
    for (int i = 0; i < 50; i++) {
        vec3 p = ro + rd * t;
        float d = getSceneSDF(p);
        if (d < 0.001) return 0.0;
        if (t > maxDist) return 1.0;
        t += d;
    }
    return 1.0;
}

vec3 getNormal(vec3 p) {
    float eps = 0.001;
    vec2 e = vec2(1.0, -1.0) * eps;
    
    return normalize(
        e.xyy * getSceneSDF(p + e.xyy) +
        e.yyx * getSceneSDF(p + e.yyx) +
        e.yxy * getSceneSDF(p + e.yxy) +
        e.xxx * getSceneSDF(p + e.xxx)
    );
}



RayHit rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    RayHit hit;
    
    for (int i = 0; i < 256; i++) {
        vec3 p = ro + rd * t;
        float d = getSceneSDF(p);
        
        if (abs(d) > 80.0) {
            hit.dist = -1.0;
            return hit;
        }
        
        if (abs(d) < 0.001) {
            hit.dist = t;
            hit.pos = p;
            hit.normal = getNormal(p);
            return hit;
        }
        
        t += d;
    }
    
    hit.dist = -1.0;
    return hit;
}

void main( void ) {
    // UV координаты
    vec2 uv = (gl_FragCoord.xy - 0.5 * vec2(FX, FY)) / vec2(FY, FY);
    
    // Камера
    float camAngle = u_time * 0.2;
    float radius = Zoom;
    
    vec3 ro = vec3(
        sin(camAngle) * radius,
        0.5,
        cos(camAngle) * radius
    );
    
    vec3 target = vec3(0.0, 0.2, 0.0);
    vec3 dir = normalize(target - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(dir, up));
    up = cross(right, dir);
    
    vec3 rd = normalize(dir + uv.x * right + uv.y * up);
    
    // Raymarching
    RayHit hit = rayMarch(ro, rd);
    
    // Фон (тоже в стиле аниме)
    vec3 color = vec3(0.1, 0.05, 0.15);
    
    if (hit.dist > 0.0) {
        // === НАСТРОЙКИ СЕЛЛ-ШЕЙДИНГА ===
        
        // Базовый цвет сердца (ярко-красный)
        vec3 heartColor = vec3(0.9, 0.08, 0.08);
        
        // Вариация цвета от нормали (для объема)
        float normalVariation = abs(hit.normal.y) * 0.3 + 0.7;
        heartColor *= normalVariation;
        
        // Освещение
        vec3 lightPos = vec3(3.0, 5.0, 3.0);
        vec3 lightDir = normalize(lightPos - hit.pos);
        vec3 viewDir = normalize(ro - hit.pos);
        
        // Тени
        float shadow = getShadow(hit.pos + hit.normal * 0.01, lightDir);
        
        // === ПРИМЕНЯЕМ СЕЛЛ-ШЕЙДИНГ ===
        color = celShadeColor(hit, heartColor, hit.normal, lightDir, viewDir, shadow);
        
        // === ДОПОЛНИТЕЛЬНЫЕ ЭФФЕКТЫ В СТИЛЕ АНИМЕ ===
        
        // 1. Риминг (подсветка сзади) - цветная
        float rim = 1.0 - max(dot(viewDir, hit.normal), 0.0);
        rim = pow(rim, 3.0);
        color += vec3(1.0, 0.3, 0.4) * rim * 0.4;
        
        // 2. Красное свечение изнутри
        float innerGlow = 0.5 + 0.5 * sin(hit.pos.y * 10.0 + u_time);
        color += vec3(0.5, 0.0, 0.0) * innerGlow * 0.1;
        
        // 3. Жирные контуры (еще один способ)
        float outline = 1.0 - max(dot(viewDir, hit.normal), 0.0);
        outline = step(0.5, outline) * 0.2;
        color -= vec3(outline);
        
        // 4. Клип-арт эффект (насыщенные цвета)
        color = clamp(color, 0.0, 1.0);
    }
    
    // === ПОСТ-ЭФФЕКТЫ В СТИЛЕ АНИМЕ ===
    
    // Виньетка
    float vignette = 1.0 - length(uv) * 0.5;
    color *= vignette;
    
    // Усиление контраста (для более "мультяшного" вида)
    color = pow(color, vec3(0.9));
    
    // Гамма-коррекция
    color = pow(color, vec3(1.0 / 2.2));
    
    o_color = vec4(color, 1.0);
}`)
            .then(() => initShaders());
    
    initBuffer();

    startTime = new Date().getMilliseconds();
    drawScene();
}
