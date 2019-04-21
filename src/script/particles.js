"use strict";

const ParticlesShaders = (function () {
  let common =
`/* Decodes a float value (16 bits in [0,1])
* from a 2D value (2x8bits in [0,1]x[0,1]) */
float decode(vec2 v)
{
    v = clamp(v, vec2(0), vec2(1));
  return 255.0 * (v.x * 256.0 + v.y) / 65535.0;
}

/* Encodes a float value (16 bits in [0,1])
* into a 2D value (2x8bits in [0,1]x[0,1]) */
vec2 encode(float x)
{
    x = clamp(x, 0.0, 1.0) * (255.0 + 255.0 / 256.0);
  return vec2(floor(x), floor(fract(x) * 256.0)) / 255.0;
}

vec2 decodePos(vec4 texel)
{
    vec2 pos = vec2(decode(texel.rg), decode(texel.ba));
    return 2.0 * pos - 1.0;
}

vec4 encodePos(vec2 pos)
{
    pos = 0.5 * clamp(pos, vec2(-1), vec2(1)) + 0.5;
  return vec4(encode(pos.x), encode(pos.y));
}

vec4 encodeBirthdate(float t)
{
    return vec4(encode(10.0 * t / 65535.0), 0, 0);
}

float decodeBirthdate(vec4 texel)
{
    return 65535.0 * decode(texel.rg) / 10.0;
}

const float PI = 3.141592653;

/* Orientation in [-PI,PI] */
vec4 encodeLooks(vec3 color, float orientation)
{
    orientation = 0.5 * orientation / PI + 0.5;
    return vec4(color, orientation);
}

void decodeLooks(vec4 texel, out vec3 color, out float orientation)
{
    color = texel.rgb;
    orientation = 2.0 * (texel.a - 0.5) * PI;
}

___FLOWMAP_COMMON___`;
  common = common.replace(/___FLOWMAP_COMMON___/g, FlowmapShaders.encodingStr);

  const updateVertSrc =
`attribute vec2 aCorner; //in {0,1}x{0,1}

varying vec2 sampleCoords;

void main(void)
{
    sampleCoords = aCorner;
    gl_Position = vec4(2.0*aCorner - 1.0, 0, 1);
}`;

  const updatePosFragSrc =
`precision mediump float;

uniform sampler2D uPrevPosBuffer;
uniform sampler2D uInitPosBuffer;
uniform sampler2D uBirthdateBuffer;

uniform sampler2D uFlowmap;

uniform float uAspectRatio;

uniform float uLifetime;
uniform float uTime;
uniform float uDt;

varying vec2 sampleCoords;

___COMMON___

void main(void)
{
    vec2 pos = decodePos(texture2D(uPrevPosBuffer, sampleCoords));
    vec2 flow = decodeFlow(texture2D(uFlowmap, 0.5*pos + 0.5));
    flow.y *= uAspectRatio;

    pos += 10.0 * uDt * flow / 512.0;

    float birthdate = decodeBirthdate(texture2D(uBirthdateBuffer, sampleCoords));
    if (uTime > birthdate + uLifetime) {
        pos = decodePos(texture2D(uInitPosBuffer, sampleCoords));
    }

    gl_FragColor = encodePos(pos);
}`;

  const updateBirthdateFragSrc =
`precision mediump float;

uniform sampler2D uBirthdateBuffer;

uniform float uLifetime;
uniform float uTime;

varying vec2 sampleCoords;

___COMMON___

void main(void)
{
    float birthdate = decodeBirthdate(texture2D(uBirthdateBuffer, sampleCoords));

    if (uTime > birthdate + uLifetime) {
        birthdate += uLifetime;
    }

    gl_FragColor = encodeBirthdate(birthdate);
}`;

  const updateLooksFragSrc =
`precision mediump float;

uniform sampler2D uBackground;
uniform sampler2D uPosBuffer;
uniform sampler2D uInitPosBuffer;
uniform sampler2D uFlowmap;

varying vec2 sampleCoords;

___COMMON___

void main(void)
{
    vec2 pos = decodePos(texture2D(uPosBuffer, sampleCoords));
    vec2 vel = decodeFlow(texture2D(uFlowmap, 0.5*pos + 0.5));

    vec2 initPos = decodePos(texture2D(uInitPosBuffer, sampleCoords));
    vec3 color = texture2D(uBackground, 0.5*initPos + 0.5).rgb;
    float orientation = atan(vel.y, vel.x);

    gl_FragColor = encodeLooks(color, orientation);
}`;

  const drawVertSrc =
`uniform sampler2D uPosBuffer;
uniform sampler2D uBirthdateBuffer;
uniform sampler2D uLooksBuffer;

uniform vec2 uCanvasSize; //in pixels
uniform vec2 uStrokeSize; //in pixels;

uniform float uDepth;

uniform float uLifetime;
uniform float uTime;
const float BIRTHTIME = 1.0;
const float DEATHTIME = 1.0;

attribute vec2 aStrokeCorner;
attribute vec2 aSampleCoords;

___COMMON___

varying vec4 color;

vec2 rotateVector(vec2 v, float radAngle)
{
      float c = cos(radAngle), s = sin(radAngle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main(void) {
      vec2 pos = decodePos(texture2D(uPosBuffer, aSampleCoords));
    float birthdate = decodeBirthdate(texture2D(uBirthdateBuffer, aSampleCoords));
    float deathdate = birthdate + uLifetime;

    float birthFactor = smoothstep(birthdate, birthdate + BIRTHTIME, uTime);
    float deathFactor = 1.0 - smoothstep(deathdate - DEATHTIME, deathdate, uTime);
    float sizefactor = min(birthFactor, deathFactor);

    vec3 color3;
    float orientation;
    decodeLooks(texture2D(uLooksBuffer, aSampleCoords), color3, orientation);
    color = vec4(color3, 1);

    vec2 corner = aStrokeCorner * uStrokeSize;
    corner = rotateVector(corner, orientation);
    corner /= uCanvasSize;

    gl_Position = vec4(pos + sizefactor * corner, uDepth, 1);
}`;

  const drawFragSrc =
`precision mediump float;

varying vec4 color;

void main(void)
{
      gl_FragColor = color;
}`;

  let drawShader = null;
  let updatePosShader = null;
  let updateBirthdateShader = null;
  let updateLooksShader = null;
  let ANGLE = null;
  
  function buildDrawShader(gl) {
    const vertexSrc = drawVertSrc.replace(/___COMMON___/g, common);
    const fragmentSrc = drawFragSrc;
    
    drawShader = Shader.fromString(gl, vertexSrc, fragmentSrc);
    drawShader.a["aStrokeCorner"].VBO = VBO.createQuad(gl, -.5, -.5, +.5, +.5);
  }
  
  function buildUpdatePosShader(gl) {
    const vertexSrc = updateVertSrc;
    let fragmentSrc = updatePosFragSrc.replace(/___COMMON___/g, common);

    updatePosShader = Shader.fromString(gl, vertexSrc, fragmentSrc);
    updatePosShader.a["aCorner"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
  }

  function buildUpdateBirthdateShader(gl) {
    const vertexSrc = updateVertSrc;
    let fragmentSrc = updateBirthdateFragSrc.replace(/___COMMON___/g, common);

    updateBirthdateShader = Shader.fromString(gl, vertexSrc, fragmentSrc);
    updateBirthdateShader.a["aCorner"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
  }
  
  function buildUpdateLooksShader(gl) {
    const vertexSrc = updateVertSrc;
    let fragmentSrc = updateLooksFragSrc.replace(/___COMMON___/g, common);

    updateLooksShader = Shader.fromString(gl, vertexSrc, fragmentSrc);
    updateLooksShader.a["aCorner"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
  }
  
  const visible = {
    init: function (gl) {
      if (drawShader === null) {
        buildDrawShader(gl);
      }
      if (updatePosShader === null) {
        buildUpdatePosShader(gl);
      }
      if (updateBirthdateShader === null) {
        buildUpdateBirthdateShader(gl);
      }
      if (updateLooksShader === null) {
        buildUpdateLooksShader(gl);
      }
      
      ANGLE = gl.getExtension("ANGLE_instanced_arrays");
      if (ANGLE === null) {
        alert("Your browser or device does not seem to support ANGLE_instanced_arrays extension.\nThe simulation won't run as intended.");
      }
    },
    
    drawShader: function() { return drawShader; },
        
    updatePosShader: function() { return updatePosShader; },
    
    updateBirthdateShader: function() { return updateBirthdateShader; },
    
    updateLooksShader: function() { return updateLooksShader; },
    
    ANGLE: function() { return ANGLE; },
  };

  return Object.freeze(visible);
})();


/**
 * Class for storing, updating and displaying particles.
 * A particles' state is stored into 3 textures, 1 pixel/particle:
 * - a position texture (rg -> x, ba -> y)
 * - a birthdate texture (rg -> birthdate)
 * - a looks texture (rgb -> color, a -> orientation)
 */
class Particles {
  /**
   * Creates a Particles object.
   * The particles are stored in data textures of size width*height,
   * so there will be width*height particles.
   *
   * @param {WebGLRenderingContext} gl
   * @param {Sampler2D} sampler used to asmple the initial positions
   * @param {number} width should be a power of two
   * @param {number} height should be a power of two
   * @param {number} lifetime time after which a particle is returned to its initial position
   */
  constructor(gl, sampler, width=1, height=1, lifetime=3) {
    ParticlesShaders.init(gl);

    this.lifetime = lifetime;
    
    this._FBO = FBO.create(gl, width, height);
    
    this.init(gl, width, height, sampler);
    
    this._currIndex = 0;
  }

  /** @returns {number} */
  get nbParticles() {
    return this.width * this.height;
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

  /** @returns {number} */
  get width() {
    return this._FBO.width;
  }

  /** @returns {number} */
  get height() {
    return this._FBO.height;
  }

  /**
   * Update position data texture. Shader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   * @param {Flowmap} flowmap
   */
  updatePositions(gl, flowmap) {
    const currIndex = this.currIndex;
    const nextIndex = this.nextIndex;
    
    let updatePosShader = ParticlesShaders.updatePosShader();
    updatePosShader.u["uPrevPosBuffer"].value = this._posTextures[currIndex];
    updatePosShader.u["uInitPosBuffer"].value = this._initPosTexture;
    updatePosShader.u["uBirthdateBuffer"].value = this._birthdateTextures[currIndex];
    updatePosShader.u["uFlowmap"].value = flowmap.texture;
        
    this._FBO.bind(gl, this._posTextures[nextIndex]);
    updatePosShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Update birthdate data texture. Shader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   */
  updateBirthdates(gl) {
    const currIndex = this.currIndex;
    const nextIndex = this.nextIndex;
    
    let updateBirthdateShader = ParticlesShaders.updateBirthdateShader();
    updateBirthdateShader.u["uBirthdateBuffer"].value = this._birthdateTextures[currIndex];

    this._FBO.bind(gl, this._birthdateTextures[nextIndex]);
    updateBirthdateShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Update looks data texture. Shader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   * @param {Flowmap} flowmap
   * @param {Background} background
   */
  updateLooks(gl, flowmap, background) {
    const currIndex = this.currIndex;
    const nextIndex = this.nextIndex;
    
    let updateLooksShader = ParticlesShaders.updateLooksShader(gl);
    updateLooksShader.u["uBackground"].value = background.texture;
    updateLooksShader.u["uPosBuffer"].value = this._posTextures[currIndex];
    updateLooksShader.u["uInitPosBuffer"].value = this._initPosTexture;
    updateLooksShader.u["uFlowmap"].value = flowmap.texture;
    
    this._FBO.bind(gl, this._looksTexture);
    updateLooksShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Displays the particles. The shader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   */
  draw(gl) {
    const currIndex = this.currIndex;
    
    let drawShader = ParticlesShaders.drawShader();
    drawShader.u["uPosBuffer"].value = this._posTextures[currIndex];
    drawShader.u["uBirthdateBuffer"].value = this._birthdateTextures[currIndex];
    drawShader.u["uLooksBuffer"].value = this._looksTexture;
    drawShader.u["uLifetime"].value = this.lifetime;
    drawShader.a["aSampleCoords"].VBO = this._sampleCoordsVBO;
    
    drawShader.bindUniformsAndAttributes(gl);
    
    let ANGLE = ParticlesShaders.ANGLE();
    const aSampleCoords = drawShader.a["aSampleCoords"];
    ANGLE.vertexAttribDivisorANGLE(aSampleCoords.loc, 1);
    
    const aCorner = drawShader.a["aStrokeCorner"];
    ANGLE.vertexAttribDivisorANGLE(aCorner.loc, 0);
    
    ANGLE.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, this.nbParticles);
  }

  /**
   * Helper method to create a data texture.
   * @param {WebGLRenderingContext} gl
   * @param {Uint8Array} data no size checks performed
  *  @returns {WebGLTexture}
   */
  createParticlesTexture(gl, data) {
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return texture;
  }

  /**
   * Initializes the data textures.
   * width*height is the size of the data texutures, so there will be
   * width*height particles.
   * @param {WebGLRenderingContext} gl
   * @param {number} width non-power-of-two values may bug on some platforms
   * @param {number} height non-power-of-two values may bug on some platforms
   * @param {Sampler2D} sampler
   */
  init(gl, width, height, sampler) {
    this._FBO.width = width;
    this._FBO.height = height;
    
    this.createSampleCoordsVBO(gl);

    this.initPosTextures(gl, sampler);
    this.initBirthdateTextures(gl);
    this._looksTexture = this.createParticlesTexture(gl, null);
  }

  /**
   * Initializes the VBO this._sampleCoordsVBO with the coordinates where
   * to sample the data textures.
   * @param {WebGLRenderingContext} gl
   */
  createSampleCoordsVBO(gl) {
    let sampleCoords = [];
    for (let iY = 0; iY < this.height; ++iY) {
      for (let iX = 0; iX < this.width; ++iX) {
        sampleCoords.push(iX / this.width);
        sampleCoords.push(iY / this.height);
      }
    }
    const data = new Float32Array(sampleCoords);
    this._sampleCoordsVBO = VBO.createFromArray(gl, data, 2, gl.FLOAT);
  }
  
  /* Takes value in [0,1] and returns vec2 in [0,256]x[0,256] */
  static encode(value) {
      value = Math.max(0, Math.min(1, value)) * (255.0 + 255.0/256.0);
      return [Math.floor(value), (value - Math.floor(value)) * 256];
  }

  /**
   * Initializes the position textures this._posTextures[i], i=0..1
   * and this._initPosTexture with the same values.
   *
   * @param {WebGLRenderingContext} gl
   * @param {Sampler2D} sampler
   */
  initPosTextures(gl, sampler) {
    /* Tales pos in [0,1], returns a texel. */
    function encodePos(pos) {   
      const rg = Particles.encode(pos[0]);
      const ba = Particles.encode(pos[1]);
      return [rg[0], rg[1], ba[0], ba[1]];
    }
    
    let texels = [];
    for (let i = 0; i < this.width * this.height; ++i) {
      let pos = sampler.sample();
      texels.push.apply(texels, encodePos(pos));
    }
    const data = new Uint8Array(texels);
    
    this._posTextures = [];
    this._posTextures[0] = this.createParticlesTexture(gl, data);
    this._posTextures[1] = this.createParticlesTexture(gl, data);
    this._initPosTexture = this.createParticlesTexture(gl, data);
  }

  /**
   * Initializes the birthdate textures:this._birthdateTextures[i], i=0..1
   * with the same values.
   * 
   * @param {WebGLRenderingContext} gl
   */
  initBirthdateTextures(gl) {
    function encodeBirthdate(birthdate) {
      birthdate *= 10;
      return Particles.encode(birthdate / 65535);
    }
    
    let texels = [];
    for (let i = 0; i < this.width * this.height; ++i) {
      let birthdate = this.lifetime * Math.random();
      texels.push.apply(texels, encodeBirthdate(birthdate));
      texels.push.apply(texels, [0,0]);
    }
    const data = new Uint8Array(texels);
    
    this._birthdateTextures = [];
    this._birthdateTextures[0] = this.createParticlesTexture(gl, data);
    this._birthdateTextures[1] = this.createParticlesTexture(gl, data);
  }
}