let rigid_bodys = [];
let rigid_body = {};
let dummyVec2 = vec2.create();
const g = 9.8;

export function createBody(pos, mass, width, height) {
    rigid_body.mass = mass;
    rigid_body.velocity = 0;
    rigid_body.pos = pos;
    rigid_body.width = width;
    rigid_body.height = height;
    rigid_body.ax1 = vec2.set(vec2.create, 0, 1);
    rigid_body.ax2 = vec2.set(vec2.create, 1, 0);
    return rigid_body;
}

export function response() {
    bodyResponse(rigid_body);
}

function bodyResponse(dt, body) {
    body.velocity[1] += dt * g;
    vec2.add(body.pos, vec2.mul(body.velocity, vec2.set(dummyVec2, dt, dt)));
}
