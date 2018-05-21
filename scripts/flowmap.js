"use strict";

const FlowmapShaders = (function () {
  const encoding =
`vec2 decodeFlow(vec4 texel)
{
    return 2.0 * texel.rg - 1.0;
}

vec4 encodeFlow(vec2 flow)
{
    return vec4(0.5 * flow + 0.5, 0, 0);
}`;

  const vertSrc =
`attribute vec2 aSampleCoords; //in [0,1]x[0,1]

varying vec2 sampleCoords;

void main(void) {
    sampleCoords = aSampleCoords;
    
    gl_Position = vec4(2.0*aSampleCoords - 1.0, 0, 1);
}`;

  const resetFragSrc =
`precision mediump float;

uniform sampler2D uInitFlow;
uniform sampler2D uFlow;

uniform float uFactor; //expeccted to be in [0, 1]

varying vec2 sampleCoords;

___FLOWMAP_COMMON___

void main(void) {
    vec2 initFlow = decodeFlow(texture2D(uInitFlow, sampleCoords));
    vec2 flow = decodeFlow(texture2D(uFlow, sampleCoords));
    
    flow += min(abs(initFlow - flow), vec2(uFactor)) * sign(initFlow - flow);

    gl_FragColor = encodeFlow(flow);
}`;

  const changeFragSrc =
`precision mediump float;
  
uniform sampler2D uPrevFlow;

uniform vec2 uFlow;
uniform vec2 uBrushSize; //relative, in [0,1]x[0,1]
uniform vec2 uBrushPos; //relative, in [0,1]x[0,1]

varying vec2 sampleCoords;

___FLOWMAP_COMMON___

void main(void) {
  vec2 prevFlow = decodeFlow(texture2D(uPrevFlow, sampleCoords));
  
  vec2 toBrush = (uBrushPos - sampleCoords) / uBrushSize;
  float influence = smoothstep(0.0, 1.0, length(toBrush));
  influence = clamp(influence, 0.0, 1.0);
  
  vec2 nextFlow = mix(normalize(uFlow), prevFlow, influence);
  
  gl_FragColor = encodeFlow(nextFlow);
}`;
  
  let resetShader = null;
  let changeShader = null;

  /**
   * @param {WebGLRenderingContext} gl
   */
  function buildResetShader(gl) {
    if (resetShader === null) {
      const fragSrc = resetFragSrc.replace(/___FLOWMAP_COMMON___/g, encoding);

      resetShader = Shader.fromString(gl, vertSrc, fragSrc);
      resetShader.a["aSampleCoords"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
    }
  }

  /**
   * @param {WebGLRenderingContext} gl
   */
  function buildChangeShader(gl) {
    if (changeShader === null) {
      const fragSrc = changeFragSrc.replace(/___FLOWMAP_COMMON___/g, encoding);

      changeShader = Shader.fromString(gl, vertSrc, fragSrc);
      changeShader.a["aSampleCoords"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
    }
  }
  
  const visible = {
    /** @param {WebGLRenderingContext} gl */
    init: function(gl) {
      buildResetShader(gl);
      buildChangeShader(gl);
    },

    encodingStr: encoding,

    resetShader: function() { return resetShader; },
    
    changeShader: function() { return changeShader; }
  };

  return Object.freeze(visible);
})();


class Flowmap {
  /**
   * @param {WebGLRenderingContext} gl
   * @param {HTMLImageElement} img
   */
  constructor(gl, img) {
    FlowmapShaders.init(gl);
    
    /* Allocate texture and send the img to GPU */
    const tex = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
    for (let texture of tex) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);      
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    this._textures = [tex[0], tex[1]];
    this._initTexture = tex[2];
    
    this._FBO = FBO.create(gl, img.width, img.height);
    
    this._currIndex = 0;
  }

  /**
   * @param {WebGLRenderingContext} gl
   */
  reset(gl) {
    this._FBO.bind(gl, this._textures[this.nextIndex]);
    
    let resetShader = FlowmapShaders.resetShader();
    resetShader.u["uInitFlow"].value = this._initTexture;
    resetShader.u["uFlow"].value = this._textures[this.currIndex];
    
    resetShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    this.switchBuffers();
  }

  /**
   * Modifies the flowmap. the changeShader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   */
  change(gl) {
    this._FBO.bind(gl, this._textures[this.nextIndex]);
    
    let changeShader = FlowmapShaders.changeShader();
    changeShader.u["uPrevFlow"].value = this._textures[this.currIndex];
    
    changeShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    this.switchBuffers();
  }

  /** @returns {WebGLTexture} The current texture */
  get texture() {
    return this._textures[this.currIndex];
  }

  /** @returns {number} */
  get currIndex() {
    return this._currIndex;
  }

  /** @returns {number} */
  get nextIndex() {
    return (this._currIndex + 1) % 2;
  }

  /** @returns {number} */
  switchBuffers() {
    this._currIndex = this.nextIndex;
  }
}