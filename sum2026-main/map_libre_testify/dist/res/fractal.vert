#version 300 es
precision highp float;

layout (location = 0) in vec2 a_pos;
uniform mat3 u_body_matr;

void main() {
    gl_Position = vec4(u_body_matr * vec3(a_pos, 1), 1);
    gl_Position.z = 0.0;
}