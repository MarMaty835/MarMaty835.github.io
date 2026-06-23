#version 300 es
precision highp float;
layout (location = 0) out vec4 o_color;

uniform float u_time;
uniform mat3 u_body_matr;


void main() {
    o_color = vec4(u_body_matr[2], 1);
    o_color = vec4(0, 0, 0, 1);
}