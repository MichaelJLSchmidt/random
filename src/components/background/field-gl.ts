import { field as F } from '@/motion/tokens'
import { fragmentSource, vertexSource } from './shader'

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
  breath: [number, number]
  lum: number
  fade: number
  topo: number
  topoShape: number
  topoTime: number
  lineColor: [number, number, number]
}

export type Elevation = { width: number; height: number; data: Float32Array; min: number; max: number }

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
  'uBreath',
  'uLum',
  'uFade',
  'uGrain',
  'uTopo',
  'uTopoShape',
  'uTopoTime',
  'uTopoLines',
  'uElevRange',
  'uElevMap',
  'uElev',
  'uLineColor',
] as const

/*
 * One WebGL2 context on one canvas. The drawing buffer is half the CSS size
 * with devicePixelRatio capped at 1; CSS scales it up. Throws when WebGL2 or
 * the shader is unavailable, so the caller can keep the CSS fallback.
 */
export class GlField {
  private gl: WebGL2RenderingContext
  private u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  private program: WebGLProgram
  private texture: WebGLTexture
  // Until About's elevation loads, noise contours span a plausible range (lake level to summits).
  private elev = { width: 1, height: 1, min: 558, max: 2400, aspect: 1 }
  private width = 0
  private height = 0

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

    // Elevation texture (RG16F: elevation 0..1, lake mask); 1x1 until About loads it.
    this.texture = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, 1, 1, 0, gl.RG, gl.FLOAT, new Float32Array([0.5, 0]))
    gl.uniform1i(this.u.uElev, 0)
    gl.uniform1f(this.u.uGrain, F.grain)
    gl.uniform4f(this.u.uTopoLines, F.topoLine, F.topoIndex, 100, 500)
    this.resize()
  }

  /** Matches the drawing buffer to the canvas's CSS size. */
  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const scale = Math.min(devicePixelRatio || 1, 1) * F.renderScale
    const w = Math.max(1, Math.round(rect.width * scale))
    const h = Math.max(1, Math.round(rect.height * scale))
    if (w === this.width && h === this.height) return
    this.width = this.canvas.width = w
    this.height = this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
  }

  /** Uploads the About elevation (row 0 = north). */
  setElevation({ width, height, data, min, max }: Elevation) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, width, height, 0, gl.RG, gl.FLOAT, data)
    this.elev = { width, height, min, max, aspect: width / height }
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
    gl.uniform2f(u.uBreath, f.breath[0], f.breath[1])
    gl.uniform1f(u.uLum, f.lum)
    gl.uniform1f(u.uFade, f.fade)
    gl.uniform1f(u.uTopo, f.topo)
    gl.uniform1f(u.uTopoShape, f.topoShape)
    gl.uniform1f(u.uTopoTime, f.topoTime)
    gl.uniform3f(u.uLineColor, ...f.lineColor)
    gl.uniform2f(u.uElevRange, this.elev.min, this.elev.max)
    // Cover the viewport with the (square) elevation, centred.
    const ratio = aspect / this.elev.aspect
    gl.uniform4f(u.uElevMap, ratio > 1 ? 1 : ratio, ratio > 1 ? 1 / ratio : 1, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.gl.deleteProgram(this.program)
    this.gl.deleteTexture(this.texture)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
