#version 300 es
precision highp float;
layout (location = 0) out vec4 o_color;

uniform float u_time;



void main() {
    o_color = vec4(1, 0, 0, 1);
}