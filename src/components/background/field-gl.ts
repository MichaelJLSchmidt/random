import { field as F } from '@/motion/tokens'
import { fragmentSource, vertexSource } from './shader'
import { contourInterval, coverTransform, loadTerrain, region } from './terrain'

/** Everything the shader needs for one frame (colours in sRGB 0..1). */
export type FieldFrame = {
  time: number
  a: Float32Array // 9: field, mid, glow
  b: Float32Array
  intensity: [number, number]
  spread: number
  origin: [number, number]
  maxD: number
  pull: [number, number]
  pullAmt: number
  /** Each pool's drift offset (x already scaled by the aspect), 3 x vec2. */
  drift: Float32Array
  breath: [number, number]
  lum: number
  fade: number
  /** About's contours, 0..1, eased. */
  topo: number
  ground: [number, number, number]
  line: [number, number, number]
}

const UNIFORMS = [
  'uRes',
  'uAspect',
  'uTime',
  'uA',
  'uB',
  'uI',
  'uSpread',
  'uOrigin',
  'uMaxD',
  'uPull',
  'uPullAmt',
  'uDrift',
  'uBreath',
  'uLum',
  'uFade',
  'uGrain',
  'uTopo',
  'uHeight',
  'uEnc',
  'uUv',
  'uInterval',
  'uLines',
  'uIndexEvery',
  'uBand',
  'uGround',
  'uLine',
] as const

const C = F.contours

/** The contour tuning for this device: desktop (fine pointer, a large screen) or mobile. */
function contourTier() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
  return fine && Math.max(screen.width, screen.height) >= C.desktopMinScreen ? C.desktop : C.mobile
}

/*
 * One WebGL2 context on one canvas. The gradient's drawing buffer is half the
 * CSS size with devicePixelRatio capped at 1; CSS scales it up. While About's
 * contours show or morph (`crisp`), the buffer runs at the device pixel ratio
 * capped at 1.5 (desktop) or 1.25 (mobile), so 1 px lines are 1 px. Throws
 * when WebGL2 or the shader is unavailable, so the caller can keep the CSS
 * fallback.
 */
export class GlField {
  private gl: WebGL2RenderingContext
  private u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  private program: WebGLProgram
  private terrain: WebGLTexture | null = null
  private loading: Promise<boolean> | null = null
  private width = 0
  private height = 0
  private cssW = 1
  private cssH = 1
  private tier = contourTier()

  constructor(
    private canvas: HTMLCanvasElement,
    onLost: () => void,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    })
    if (!gl) throw new Error('WebGL2 unavailable')
    this.gl = gl
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      onLost()
    })

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.bindAttribLocation(program, 0, 'aPos')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link')
    this.program = program
    gl.useProgram(program)
    this.u = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as never

    // One triangle covering the screen.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    gl.uniform1i(this.u.uHeight, 0)
    gl.uniform1f(this.u.uGrain, F.grain)
    gl.uniform2f(this.u.uEnc, region.offset, region.scale)
    gl.uniform1f(this.u.uIndexEvery, C.indexEvery)
    this.resize()
  }

  /** Extra resolution factor: 1, or 1/2 while a pinned scene holds the viewport. */
  detail = 1

  /** Full device resolution (capped) for the contour lines. */
  private sharp = false

  get crisp() {
    return this.sharp
  }

  set crisp(on: boolean) {
    if (on === this.sharp) return
    this.sharp = on
    this.resize()
  }

  /** Matches the drawing buffer to the canvas's CSS size. */
  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = devicePixelRatio || 1
    const scale = this.sharp ? Math.min(dpr, this.tier.dprMax) : Math.min(dpr, 1) * F.renderScale * this.detail
    this.cssW = Math.max(1, rect.width)
    this.cssH = Math.max(1, rect.height)
    const w = Math.max(1, Math.round(rect.width * scale))
    const h = Math.max(1, Math.round(rect.height * scale))
    if (w === this.width && h === this.height) return
    this.width = this.canvas.width = w
    this.height = this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
  }

  /** True once the region heightmap is on the GPU. */
  get hasTerrain() {
    return this.terrain !== null
  }

  /** Loads the region heightmap once (resolves false when it cannot be decoded exactly). */
  loadTerrain() {
    this.loading ??= loadTerrain(this.gl, 0).then(
      (tex) => {
        this.terrain = tex
        return true
      },
      () => false,
    )
    return this.loading
  }

  draw(f: FieldFrame) {
    const { gl, u } = this
    const aspect = this.width / this.height
    gl.uniform2f(u.uRes, this.width, this.height)
    gl.uniform1f(u.uAspect, aspect)
    gl.uniform1f(u.uTime, f.time)
    gl.uniform3fv(u.uA, f.a)
    gl.uniform3fv(u.uB, f.b)
    gl.uniform2f(u.uI, f.intensity[0], f.intensity[1])
    gl.uniform1f(u.uSpread, f.spread)
    gl.uniform2f(u.uOrigin, f.origin[0], f.origin[1])
    gl.uniform1f(u.uMaxD, f.maxD)
    gl.uniform2f(u.uPull, f.pull[0], f.pull[1])
    gl.uniform1f(u.uPullAmt, f.pullAmt)
    gl.uniform2fv(u.uDrift, f.drift)
    gl.uniform2f(u.uBreath, f.breath[0], f.breath[1])
    gl.uniform1f(u.uLum, f.lum)
    gl.uniform1f(u.uFade, f.fade)
    // Contours only with the heightmap on the GPU (the engine never raises topo before).
    const topo = this.terrain ? f.topo : 0
    gl.uniform1f(u.uTopo, topo)
    if (topo > 0) {
      // Device px per CSS px of the buffer as drawn: line widths and the morph's bands in device px.
      const px = this.width / this.cssW
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.terrain)
      gl.uniform4f(u.uUv, ...coverTransform(this.cssW, this.cssH, region, C.zoom))
      gl.uniform1f(u.uInterval, contourInterval(region, this.cssW, this.cssH, C.zoom, this.tier.minSpacingPx))
      gl.uniform4f(u.uLines, C.lineWidthPx * px, C.indexWidthPx * px, C.lineAlpha, C.indexAlpha)
      gl.uniform1f(u.uBand, C.bandPx * px * (1 - topo))
      gl.uniform3f(u.uGround, ...f.ground)
      gl.uniform3f(u.uLine, ...f.line)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.gl.deleteProgram(this.program)
    if (this.terrain) this.gl.deleteTexture(this.terrain)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
