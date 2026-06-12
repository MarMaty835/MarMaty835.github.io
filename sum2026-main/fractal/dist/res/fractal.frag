#version 300 es
precision highp float;
layout (location = 0) out vec4 o_color;

uniform float u_time, FX, FY, ZX, ZY, Zoom;
vec2 CmplMulCmpl( vec2 A, vec2 B )
{
    vec2 a;
    a.x = A.x * B.x - A.y * B.y;
    a.y = A.x * B.y + A.y * B.x;
    return a;
}


void main() {
    vec2 Z, Z0;
    float x = (gl_FragCoord.x) * Zoom - FX;
    float y = (gl_FragCoord.y) * Zoom + FY;

    Z = vec2((4.0 / 700.0) * float(x) - 2.0, (4.0 / 700.0) * float(y - 2.0));
    Z0.x = 0.35 + 0.2 * -1.0; 
    Z0.y = 0.39 + 0.2 * sin(1.0);
    int n = 0;
    
    while (Z.x * Z.x + Z.y * Z.y < 4.0 && n < 255)
    {
        Z = CmplMulCmpl(Z, Z) + Z0;
        n++;
    }
    if (n > 200)
        o_color = vec4(float(n) / 255.0, float(n) / 255.0, 0, 1);
    else
        o_color = vec4(1, 0, 1, 1);
}