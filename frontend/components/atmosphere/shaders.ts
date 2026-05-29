// ─────────────────────────────────────────────────────────────
// Sidereus Atmospheric Shaders
// Inspired by Monet's "Impression, Sunrise" — the color
// philosophy of morning mist before a discovery.
// ─────────────────────────────────────────────────────────────

export const atmosphereVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const atmosphereFragmentShader = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_resolution;
  varying vec2  vUv;

  // ── Hash & noise primitives ────────────────────────────────
  vec3 hash3(vec2 p) {
    vec3 q = vec3(
      dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3)),
      dot(p, vec2(419.2, 371.9))
    );
    return fract(sin(q) * 43758.5453);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Gradient noise (smooth)
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);  // smoothstep curve

    vec2 h00 = -1.0 + 2.0 * hash3(i + vec2(0.0, 0.0)).xy;
    vec2 h10 = -1.0 + 2.0 * hash3(i + vec2(1.0, 0.0)).xy;
    vec2 h01 = -1.0 + 2.0 * hash3(i + vec2(0.0, 1.0)).xy;
    vec2 h11 = -1.0 + 2.0 * hash3(i + vec2(1.0, 1.0)).xy;

    return mix(
      mix(dot(h00, f - vec2(0.0, 0.0)), dot(h10, f - vec2(1.0, 0.0)), u.x),
      mix(dot(h01, f - vec2(0.0, 1.0)), dot(h11, f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Fractal Brownian Motion — layered noise for organic fog
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float freq = 1.0;
    float lacunarity = 2.1;
    float gain = 0.48;

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * noise(p * freq);
      freq *= lacunarity;
      amplitude *= gain;
    }
    return value;
  }

  // Domain-warped FBM — clouds with swirling character
  float warpedFbm(vec2 p) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0), 4),
      fbm(p + vec2(5.2, 1.3), 4)
    );
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2), 4),
      fbm(p + 4.0 * q + vec2(8.3, 2.8), 4)
    );
    return fbm(p + 4.0 * r, 5);
  }

  // Soft star / light scatter point
  float softLight(vec2 uv, vec2 pos, float size, float brightness) {
    float d = length(uv - pos);
    return brightness * exp(-d * d / (size * size));
  }

  void main() {
    vec2 uv = vUv;
    // Aspect-corrected coordinate space
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    float t = u_time * 0.04;  // Very slow drift

    // ── Base deep-space color ────────────────────────────────
    vec3 col = vec3(0.020, 0.027, 0.040);  // #050608 territory

    // ── Primary atmospheric fog layer ────────────────────────
    // Slow, large-scale cloud forms
    float fog1 = warpedFbm(p * 1.2 + vec2(t * 0.3, t * 0.15));
    fog1 = fog1 * 0.5 + 0.5;  // remap [-1,1] → [0,1]

    // Secondary layer at different scale & speed
    float fog2 = fbm(p * 2.4 + vec2(-t * 0.2, t * 0.25) + 3.0, 5);
    fog2 = fog2 * 0.5 + 0.5;

    // Fine detail micro-turbulence
    float fog3 = fbm(p * 5.0 + vec2(t * 0.5, -t * 0.3) + 7.0, 4);
    fog3 = fog3 * 0.5 + 0.5;

    // Composite fog
    float fog = fog1 * 0.55 + fog2 * 0.30 + fog3 * 0.15;
    fog = smoothstep(0.35, 0.75, fog);

    // ── Monet color palette injections ──────────────────────
    // Soft Lavender — cool morning mist
    vec3 lavender   = vec3(0.710, 0.651, 0.847);  // #B5A6D8
    // Morning Blue — horizon atmosphere
    vec3 morningBlue = vec3(0.561, 0.663, 0.847);  // #8FA9D8
    // Muted Indigo — deeper atmospheric layers
    vec3 indigoMist  = vec3(0.369, 0.435, 0.639);  // #5E6FA3
    // Sunrise Gold — warmth at the horizon edge
    vec3 sunriseGold = vec3(0.878, 0.725, 0.416);  // #E0B96A
    // Soft Peach — hint of warmth in the mist
    vec3 softPeach   = vec3(0.894, 0.722, 0.627);  // #E4B8A0

    // Vertical gradient: deeper blue at bottom, faint warmth at lower horizon
    float vertGrad = uv.y;
    vec3 fogColorBase = mix(indigoMist * 0.18, morningBlue * 0.12, vertGrad);
    fogColorBase = mix(fogColorBase, lavender * 0.10, fog1 * (1.0 - vertGrad * 0.7));

    // Sunrise glow — very faint warm zone at bottom-left (horizon suggestion)
    float horizonGlow = pow(max(0.0, 1.0 - uv.y * 2.5), 2.0)
                      * max(0.0, 1.0 - uv.x * 1.5) * 0.4;
    fogColorBase += sunriseGold * horizonGlow * 0.06;
    fogColorBase += softPeach   * horizonGlow * 0.04;

    // Apply fog
    col += fogColorBase * fog * 0.55;

    // ── Atmospheric depth haze ───────────────────────────────
    // Subtle blue-gray haze that increases toward center
    float centerDist = 1.0 - length(p) / 0.7;
    centerDist = clamp(centerDist, 0.0, 1.0);
    col += morningBlue * 0.025 * centerDist;

    // ── Soft volumetric light bands ──────────────────────────
    // Aurora-like horizontal colour veils — very faint
    float aurora1 = sin(p.x * 3.0 + t * 0.8 + fbm(vec2(p.x * 0.5, t * 0.2), 3) * 2.0) * 0.5 + 0.5;
    float aurora2 = sin(p.x * 2.0 - t * 0.6 + 1.5 + fbm(vec2(p.x * 0.3, t * 0.15 + 2.0), 3) * 1.5) * 0.5 + 0.5;
    float auroraZone = smoothstep(0.3, 0.6, uv.y) * smoothstep(0.95, 0.7, uv.y);
    col += lavender   * aurora1 * auroraZone * 0.025;
    col += morningBlue * aurora2 * auroraZone * 0.018;

    // ── Distant glowing points (stars / light scatter) ───────
    // Use deterministic positions from hash
    float starField = 0.0;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      vec2 starPos = vec2(
        fract(hash(vec2(fi * 13.7, 5.3)) + t * 0.002 * (1.0 - fi * 0.04)),
        fract(hash(vec2(fi * 7.3, fi * 2.1)) + t * 0.001 * (fi * 0.03))
      );
      // Convert to centered space
      starPos = (starPos - 0.5) * vec2(aspect, 1.0);
      float size = mix(0.008, 0.022, hash(vec2(fi, fi * 3.0)));
      float brightness = mix(0.04, 0.12, hash(vec2(fi * 2.0, fi)));
      starField += softLight(p, starPos, size, brightness);
    }
    // Color the stars in the Monet palette
    vec3 starColor = mix(lavender, morningBlue, sin(t * 0.3) * 0.5 + 0.5);
    col += starColor * starField;

    // ── Gentle vignette (very soft, keeps center open) ───────
    float vignette = 1.0 - smoothstep(0.55, 1.3, length((uv - 0.5) * vec2(1.0, 1.1)));
    col *= 0.6 + 0.4 * vignette;

    // ── Subtle noise film grain (adds premium texture) ────────
    float grain = hash(uv + fract(t)) * 0.012 - 0.006;
    col += grain;

    // ── Tone-map and clamp ────────────────────────────────────
    // Subtle filmic S-curve tone-map to keep it from clipping
    col = col / (col + vec3(0.12));
    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`

// ── Particle vertex/fragment shaders ─────────────────────────
export const particleVertexShader = /* glsl */ `
  attribute float a_size;
  attribute float a_alpha;
  attribute vec3  a_color;

  uniform float u_time;
  uniform float u_pixelRatio;

  varying float vAlpha;
  varying vec3  vColor;

  // 2D gradient noise for velocity field
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vAlpha = a_alpha;
    vColor = a_color;

    // Drift offset — very slow, organic
    float t = u_time * 0.12;
    float nx = smoothNoise(position.xy * 0.3 + vec2(t * 0.07, t * 0.05));
    float ny = smoothNoise(position.xy * 0.3 + vec2(t * 0.05, -t * 0.08) + 3.7);

    vec3 drifted = position;
    drifted.x += (nx - 0.5) * 0.12;
    drifted.y += (ny - 0.5) * 0.08 + t * 0.003;  // very slow upward drift

    // Wrap vertically
    drifted.y = mod(drifted.y + 5.0, 10.0) - 5.0;

    vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
    gl_PointSize = a_size * u_pixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3  vColor;

  void main() {
    // Circular soft point
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    // Gaussian falloff — very soft glow
    float glow = exp(-d * d * 10.0);
    float alpha = vAlpha * glow;

    gl_FragColor = vec4(vColor, alpha);
  }
`
