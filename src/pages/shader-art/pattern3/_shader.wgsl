@vertex
fn vertexMain(@location(0) pos: vec4f) -> @builtin(position) vec4f {
    return pos;
}

struct Uniforms {
    window_size: vec2f
}


fn palette(t: f32, a: vec3f, b: vec3f, c: vec3f, d: vec3f) -> vec3f {
    return a + b * cos(6.28318 * (c * t + d));
}


@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> frame: u32;
  
@fragment
fn fragmentMain2(@builtin(position) pos: vec4f) -> @location(0) vec4f {

    let offset = .05 * f32(frame);

    var uv = (pos.xy * 2.0 - uniforms.window_size) / uniforms.window_size.y;
    let uv0 = uv;

    uv = fract(uv * 1.5)- .5;


    var d = length(uv);
    var col = palette(length(uv0) + offset, vec3f(0.5, 0.5, 0.5), vec3f(0.5, 0.5, 0.5), vec3f(1.0, 1.0, 1.0), vec3f(0.263, 0.416, 0.557));

    d = sin(d * 8. + offset);

    d = abs(d);

    d = 0.2 / d;
    col *= d;

    return vec4f(col, 1.);
}

fn sdBox(pos:vec2f,b:vec2f)->f32{
    let d= abs(pos) - b;
    return length(max(d,vec2f(0.))) + min(max(d.x,d.y),0.0);
}

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {

    let offset = 0.01 * f32(frame);

    var uv = (pos.xy * 2.0 - uniforms.window_size) / uniforms.window_size.y;
    let uv0 = uv;
    var col = vec3f(0.);

    for (var i = 0; i < 4; i++) {
        uv = fract(uv * 1.2)- .5;
        var d=smoothstep(0.0,.1,abs(sdBox(uv,vec2f(0.5,0.25))));
        col += palette(d+offset, vec3f(0.5, 0.5, 0.5), vec3f(0.5, 0.5, 0.5), vec3f(1.0, 1.0, 1.0), vec3f(0.263, 0.416, 0.557));

        d = abs(d);

        d = pow(0.1 / f32(d),1.1);
        col *= d;
    }

    return vec4f(col, 1.);
}