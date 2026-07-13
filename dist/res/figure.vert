#version 300 es
precision highp float;

layout (location = 0) in vec3 a_pos;
uniform mat4 WVP;

void main() {
    gl_Position = WVP * vec3(a_pos, 1);
}