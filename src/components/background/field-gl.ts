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
  /** Each pool's drift offset (x already scaled by the aspect), 3 x vec2. */
  drift: Float32Array
  breath: [number, number]
  lum: number
  fade: number
  /** About: the pools contract and fade into the contour ground, 0..1, eased. */
  topo: number
  ground: [number, number, number]
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
  'uGround',
] as const

/*
 * One WebGL2 context on one canvas. The gradient's drawing buffer is half the
 * CSS size with devicePixelRatio capped at 1; CSS scales it up. Throws when
 * WebGL2 or the shader is unavailable, so the caller can keep the CSS
 * fallback. About's contours are not drawn here: they are an SVG layer above
 * the canvas (background-field.tsx); the shader only fades the pools into its
 * ground.
 */
export class GlField {
  private gl: WebGL2RenderingContext
  private u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  private program: WebGLProgram
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

    gl.uniform1f(this.u.uGrain, F.grain)
  }

  /** The drawing buffer's size in device pixels. */
  get size() {
    return { w: this.width, h: this.height }
  }

  /**
   * Sets the drawing buffer to `w` × `h` pixels. Resizing clears the buffer, so a caller that
   * changes the size draws in the same frame (the field engine does: from its ResizeObserver
   * callback, or at the start of an animation frame). Returns whether the size changed.
   */
  setSize(w: number, h: number) {
    w = Math.max(1, Math.round(w))
    h = Math.max(1, Math.round(h))
    if (w === this.width && h === this.height) return false
    this.width = this.canvas.width = w
    this.height = this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
    return true
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
    gl.uniform1f(u.uTopo, f.topo)
    gl.uniform3f(u.uGround, ...f.ground)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.gl.deleteProgram(this.program)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
