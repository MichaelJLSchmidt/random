/*
 * The background field's only shader. Two palettes: A (the resting field, with
 * the hover tint already mixed in on the CPU) and B (the bloomed identity).
 * B grows from uOrigin as a soft disc (uSpread 0..1). Each palette is shaded
 * as three soft colour pools (glow bottom-left, mid top-right, a mixed pool
 * centre-left) warped by low-frequency noise, with static 2% grain. Contour
 * lines (About) come from h = mix(noise, elevation, uTopo). Nothing here reads
 * the pointer.
 */
export const vertexSource = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

export const fragmentSource = `#version 300 es
precision highp float;

uniform vec2 uRes;          // drawing-buffer size in pixels
uniform float uAspect;      // width / height
uniform float uTime;        // field time in seconds (frozen in calm / reduced)
uniform vec3 uA[3];         // field, mid, glow (sRGB)
uniform vec3 uB[3];
uniform vec2 uI;            // pool intensity of A and B
uniform float uSpread;      // bloom radius 0..1
uniform vec2 uOrigin;       // bloom centre, viewport fractions (y down)
uniform float uMaxD;        // distance from the origin to the farthest corner
uniform vec2 uPull;         // point A's pools drift toward (y down)
uniform float uPullAmt;
uniform vec2 uBreath;       // pool scale, luminance
uniform float uLum;         // luminance dip (switch)
uniform float uFade;        // fade in from black
uniform float uGrain;
uniform float uTopo;        // contour lines 0..1
uniform float uTopoTime;    // 0..1 phase of the travelling highlight band
uniform vec4 uTopoLines;    // line opacity, index opacity, interval (m), index interval (m)
uniform vec2 uElevRange;    // min, max elevation (m)
uniform vec4 uElevMap;      // viewport uv -> texture uv: scale.xy, offset.xy
uniform float uTopoShape;    // noise -> elevation (topo progress x texture ready)
uniform sampler2D uElev;    // r: elevation 0..1, g: lake mask
uniform vec3 uLineColor;

out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v / 0.875;
}

float pool(vec2 q, vec2 c, float r) {
  vec2 d = q - c;
  return exp(-dot(d, d) / (r * r));
}

vec3 shade(vec3 field, vec3 mid, vec3 glow, float intensity, vec2 q, float n, float pullAmt) {
  vec2 pull = vec2(uPull.x * uAspect, uPull.y);
  float s = uBreath.x;
  vec2 c1 = mix(vec2(0.16 * uAspect, 0.88), pull, pullAmt);
  vec2 c2 = mix(vec2(0.86 * uAspect, 0.16), pull, pullAmt * 0.45);
  vec2 c3 = mix(vec2(0.34 * uAspect, 0.52), pull, pullAmt * 0.8);
  float g1 = pool(q, c1, 0.52 * s);
  float g2 = pool(q, c2, 0.58 * s);
  float g3 = pool(q, c3, 0.42 * s);
  float mod1 = 0.7 + 0.6 * n;
  vec3 col = field;
  col = mix(col, mid, clamp((g2 + g3 * 0.6) * mod1, 0.0, 1.0) * intensity);
  col = mix(col, glow, clamp((g1 * 0.55 + g3 * 0.22) * mod1, 0.0, 1.0) * intensity);
  return col;
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float t = uTime * 0.012;

  float n = fbm(p * 1.3 + vec2(t, -t * 0.7));
  vec2 warp = vec2(noise(p * 1.1 + vec2(3.1, t)), noise(p * 1.1 + vec2(-t, 7.3))) - 0.5;
  vec2 q = p + warp * 0.32;

  vec3 colA = shade(uA[0], uA[1], uA[2], uI.x, q, n, uPullAmt);
  vec3 col = colA;
  if (uSpread > 0.0) {
    vec3 colB = shade(uB[0], uB[1], uB[2], uI.y, q, n, 0.0);
    vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
    float soft = 0.22;
    float r = uSpread * (uMaxD + soft);
    float d = length(p - o) + (n - 0.5) * 0.12 * uSpread * (1.0 - uSpread) * 4.0;
    float mask = 1.0 - smoothstep(r - soft, r, d);
    col = mix(colA, colB, mask);
  }

  if (uTopo > 0.001) {
    float hn = fbm(p * 1.7 + 11.0);
    vec2 tuv = (uv - 0.5) * uElevMap.xy + 0.5 + uElevMap.zw;
    vec2 elev = texture(uElev, tuv).rg;
    float hNorm = mix(hn, elev.r, uTopoShape);
    float hm = mix(uElevRange.x, uElevRange.y, hNorm);
    float f = hm / uTopoLines.z;
    float fi = hm / uTopoLines.w;
    float line = 1.0 - smoothstep(0.0, 1.0, abs(fract(f + 0.5) - 0.5) / max(fwidth(f) * 0.75, 1e-4));
    float idx = 1.0 - smoothstep(0.0, 1.0, abs(fract(fi + 0.5) - 0.5) / max(fwidth(fi) * 1.0, 1e-4));
    float bandH = mix(uElevRange.x, uElevRange.y, uTopoTime);
    float band = exp(-pow((hm - bandH) / ((uElevRange.y - uElevRange.x) * 0.05), 2.0));
    float lake = elev.g * uTopoShape;
    float a = max(line * uTopoLines.x, idx * uTopoLines.y) * (1.0 + band * 0.9) * smoothstep(0.0, 0.4, uTopo) * (1.0 - lake);
    col = mix(col, uA[0] * 0.82, lake * 0.7);
    col = mix(col, uLineColor, a);
  }

  col *= uBreath.y * uLum * uFade;
  col += (hash(gl_FragCoord.xy + 0.5) - 0.5) * uGrain;
  outColor = vec4(col, 1.0);
}
`
