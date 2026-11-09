/*
 * The background field's only shader. Two palettes: A (the resting field, with
 * the hover tint already mixed in on the CPU) and B (the bloomed identity).
 * B grows from uOrigin as a soft disc (uSpread 0..1). Each palette is shaded
 * as three soft colour pools (glow bottom-left, mid top-right, a mixed pool
 * centre-left) warped by low-frequency noise, with static 2% grain. The pool
 * centres drift on slow Lissajous loops (uDrift, full tier only).
 *
 * About (uTopo 0..1): the old portfolio's contour field over its ground. Real
 * swisstopo heights (the region heightmap, RGBA8: h = offset + (R·65280 +
 * G·255)·scale), 1 px lines and every fifth an index line at 1.5 px,
 * anti-aliased with fract / fwidth; lines crowding closer than about 2 px fade
 * instead of aliasing. While uTopo rises the gradient's colour terraces into
 * wide bands around the contours that narrow into the lines as the ground
 * replaces the gradient; at 1 it is exactly the old field and the gradient is
 * not computed at all. Nothing here reads the pointer.
 */
export const vertexSource = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

export const fragmentSource = `#version 300 es
precision highp float;

uniform vec2 uRes;          // drawing-buffer size in pixels
uniform float uAspect;      // width / height
uniform float uTime;        // field time in seconds (frozen in reduced and while paused)
uniform vec3 uA[3];         // field, mid, glow (sRGB)
uniform vec3 uB[3];
uniform vec2 uI;            // pool intensity of A and B
uniform float uSpread;      // bloom radius 0..1
uniform vec2 uOrigin;       // bloom centre, viewport fractions (y down)
uniform float uMaxD;        // distance from the origin to the farthest corner
uniform vec2 uPull;         // point A's pools drift toward (y down)
uniform float uPullAmt;
uniform vec2 uDrift[3];     // each pool's slow Lissajous offset (aspect-scaled, full tier only)
uniform vec2 uBreath;       // pool scale, luminance
uniform float uLum;         // luminance dip (switch)
uniform float uFade;        // fade in from black
uniform float uGrain;
uniform float uTopo;        // About's contours 0..1 (eased on the CPU)
uniform sampler2D uHeight;  // the region heightmap (RGBA8 or RG8: heights packed in R high, G low)
uniform vec2 uEnc;          // height = uEnc.x + (R * 65280 + G * 255) * uEnc.y
uniform vec4 uUv;           // view st -> texture uv: scale.xy, offset.xy (cover crop on the focus)
uniform float uInterval;    // contour interval (m)
uniform vec4 uLines;        // line width, index width (device px), line alpha, index alpha
uniform float uIndexEvery;  // every n-th line is an index line
uniform float uBand;        // extra line width while morphing (device px, 0 at rest)
uniform vec3 uGround;       // the contour field's ground
uniform vec3 uLine;         // its line colour

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
  vec2 c1 = mix(vec2(0.16 * uAspect, 0.88) + uDrift[0], pull, pullAmt);
  vec2 c2 = mix(vec2(0.86 * uAspect, 0.16) + uDrift[1], pull, pullAmt * 0.45);
  vec2 c3 = mix(vec2(0.34 * uAspect, 0.52) + uDrift[2], pull, pullAmt * 0.8);
  float g1 = pool(q, c1, 0.52 * s);
  float g2 = pool(q, c2, 0.58 * s);
  float g3 = pool(q, c3, 0.42 * s);
  float mod1 = 0.7 + 0.6 * n;
  vec3 col = field;
  col = mix(col, mid, clamp((g2 + g3 * 0.6) * mod1, 0.0, 1.0) * intensity);
  col = mix(col, glow, clamp((g1 * 0.55 + g3 * 0.22) * mod1, 0.0, 1.0) * intensity);
  return col;
}

float heightAt(vec2 uv) {
  vec2 rg = texture(uHeight, uv).rg;
  return uEnc.x + (rg.r * 65280.0 + rg.g * 255.0) * uEnc.y;
}

float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

// The contour lines' strength here: regular and index lines, anti-aliased with fract / fwidth.
float contours(float extra) {
  vec2 st = gl_FragCoord.xy / uRes;
  st.y = 1.0 - st.y;
  float level = heightAt(st * uUv.xy + uUv.zw) / uInterval;
  float fw = max(fwidth(level), 1e-5);
  float dReg = abs(fract(level - 0.5) - 0.5) / fw;
  float idx = level / uIndexEvery;
  float fwIdx = fw / uIndexEvery;
  float dIdx = abs(fract(idx - 0.5) - 0.5) / fwIdx;
  // Where lines crowd closer than ~2 px (cliffs) they fade instead of aliasing into noise.
  float reg = lineMask(dReg, uLines.x + extra) * (1.0 - smoothstep(0.22, 0.55, fw)) * uLines.z;
  float ind = lineMask(dIdx, uLines.y + extra) * (1.0 - smoothstep(0.22, 0.55, fwIdx)) * uLines.w;
  return max(reg, ind);
}

vec3 gradient() {
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
  col *= uBreath.y * uLum * uFade;
  col += (hash(gl_FragCoord.xy + 0.5) - 0.5) * uGrain;
  return col;
}

void main() {
  // At rest on About: exactly the old field, one static frame, no gradient.
  if (uTopo >= 1.0) {
    outColor = vec4(mix(uGround, uLine, contours(0.0)), 1.0);
    return;
  }
  vec3 col = gradient();
  if (uTopo > 0.0) {
    // The gradient terraces into bands around the contours (lifted towards its glow); the bands
    // narrow into the lines while the ground replaces the gradient and they take the line colour.
    float a = contours(uBand) * smoothstep(0.0, 0.3, uTopo);
    vec3 ground = mix(col, uGround, smoothstep(0.2, 1.0, uTopo));
    vec3 band = mix(mix(col, uA[2], 0.6) + 0.04, uLine, smoothstep(0.1, 0.9, uTopo));
    col = mix(ground, band, a);
  }
  outColor = vec4(col, 1.0);
}
`
