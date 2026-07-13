#version 300 es
precision highp float;
layout (location = 0) out vec4 o_color;

uniform float u_time, FX, FY, ZX, ZY, Zoom;

// ============================================
// RAYMARCHING HEART - Полный рабочий код
// ============================================

// ---------- SDF сердца (главная функция) ----------
float sdHeart(vec3 p) {
    // Симметрия
    p.x = abs(p.x);
    
    // Центрируем и масштабируем
    p.y += 0.5;
    p.z *= 1.2;
    
    float a = p.x * p.x + p.y * p.y - 1.0;
    float d = a * a * a - a * p.x * p.x - p.y * p.y * p.z * p.z * 0.05;
    
    // Вычисляем градиент для стабильного расстояния
    float grad = 3.0 * a * a - p.x * p.x - 2.0 * a * p.x * 0.5;
    grad = max(abs(grad), 0.001);
    
    return d / grad;
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
    heartPos -= vec3(0.0, -0.2, 0.0);
    
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

struct RayHit {
    float dist;
    vec3 pos;
    vec3 normal;
};

RayHit rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    RayHit hit;
    
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = getSceneSDF(p);
        
        if (t > 200.0) {
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

// ---------- Главная функция рендера ----------
void main(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * vec2(FX, FY)) / FY;
    
    // Камера (крутим вокруг сердца)
    float camAngle = u_time * 0.2;
    float radius = 4.0;
    vec3 ro = vec3(
        sin(camAngle) * radius,
        1.5 + sin(u_time * 0.2) * 0.3,
        cos(camAngle) * radius
    );
    vec3 target = vec3(0.0, 0.3, 0.0);
    
    vec3 dir = normalize(target - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(dir, up));
    up = cross(right, dir);
    
    vec3 rd = normalize(dir + uv.x * right + uv.y * up);
    
    RayHit hit = rayMarch(ro, rd);
    
    vec3 color = vec3(0.1, 0.05, 0.15); // Темно-фиолетовый фон
    
    if (hit.dist > 0.0) {
        // Цвет сердца (ярко-красный с градиентом)
        vec3 heartColor = vec3(0.9, 0.1, 0.1);
        
        // Блестящая текстура (зависит от нормали)
        float gloss = abs(hit.normal.y) * 0.5 + 0.5;
        heartColor += vec3(0.3, 0.0, 0.0) * gloss;
        
        // Освещение
        vec3 lightPos = vec3(3.0, 4.0, 2.0);
        vec3 lightDir = normalize(lightPos - hit.pos);
        
        float diff = max(dot(hit.normal, lightDir), 0.0);
        float shadow = getShadow(hit.pos + hit.normal * 0.01, lightDir);
        float ambient = 0.15;
        
        float lighting = ambient + diff * shadow;
        color = heartColor * lighting;
        
        // Блик (Specular)
        vec3 viewDir = normalize(ro - hit.pos);
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(hit.normal, halfDir), 0.0), 64.0);
        color += vec3(1.0, 0.8, 0.9) * spec * shadow * 0.8;
        
        // Риминг (крайний свет для объема)
        float rim = 1.0 - max(dot(viewDir, hit.normal), 0.0);
        rim = pow(rim, 3.0) * 0.4;
        color += vec3(1.0, 0.2, 0.3) * rim;
        
        // Добавим немного красного свечения изнутри (эффект подсветки)
        float innerGlow = 0.5 + 0.5 * sin(hit.pos.y * 10.0 + u_time);
        color += vec3(0.5, 0.0, 0.0) * innerGlow * 0.1;
    }
    
    // Видеоэффект: виньетка (затемнение по краям)
    float vignette = 1.0 - length(uv) * 0.6;
    color *= vignette;
    
    // Гамма-коррекция для красивого отображения
    color = pow(color, vec3(1.0 / 2.2));
    
    fragColor = vec4(color, 1.0);
}