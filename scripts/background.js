"use strict";

const BackgroundShaders = (function () {
  const displayVertSrc =
`uniform float uDepth;

attribute vec2 aCorner;

varying vec2 sampleCoords;

void main(void) {
    sampleCoords = aCorner;
    gl_Position = vec4(2.0 * aCorner - 1.0, uDepth, 1);
}`;

  const displayFragSrc =
`precision mediump float;

uniform sampler2D uBackground;

varying vec2 sampleCoords;

void main(void) {
    vec4 color = texture2D(uBackground, sampleCoords);
    if (color.a < 0.5)
        discard;

    gl_FragColor = vec4(color.rgb, 1);
}`;

  let displayShader = null;

  /** @param {WebGLRenderingContext} gl */
  function buildDisplayShader(gl) {
    displayShader = Shader.fromString(gl, displayVertSrc, displayFragSrc);
    displayShader.a["aCorner"].VBO = VBO.createQuad(gl, 0, 0, 1, 1);
  }
  
  const visible = {
    /** @param {WebGLRenderingContext} gl */
    init: function(gl) {
      if (displayShader === null) {
        buildDisplayShader(gl);
      }
    },
    
    displayShader: function () { return displayShader; },
  };

  return Object.freeze(visible);
})();


/**
 * Class for storing a background image on GPU managing and a density map.
 * The density map is extracted from the alpha channel of the image.
 */
class Background {
  /**
   * Create a Background. Extracts the density map from the alpha channel.
   * @param {WebGLRenderingContext} gl
   * @param {HTMLImageElement} img
   */
  constructor(gl, img) {
    /* Allocate texture and send the img to GPU */
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    /* Create the sampler */
    const width = img.width;
    const height = img.height;

    // Read pixels
    const pixels = new Uint8Array(4 * width * height);
    const fbo = FBO.create(gl, width, height);
    fbo.bind(gl, this._texture);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    FBO.bindDefault(gl);
    
    // Extract density map from the alpha channel    
    let density = [];
    for(let iLine = 0; iLine < height; ++iLine) {
      density[iLine] = [];
      let line = density[iLine];
      for (let iCol = 0; iCol < width; ++iCol) {
        line.push(pixels[4 * (iCol + iLine*width) + 3]);
      }
    }
    this._sampler = new Sampler2D(density);
  }

  /**
   * @returns {WebGLTexture} the id of the GPU texture
   */
  get texture() {
    return this._texture;
  }

  /**
   * @return {Sampler2D} sampler extracted from the background alpha channel
   */
  get sampler() {
    return this._sampler;
  }

  /** Displays the background image. The shader should be binded beforehand.
   * @param {WebGLRenderingContext} gl
   */
  draw(gl) {
    let displayShader = BackgroundShaders.displayShader();
    displayShader.u["uBackground"].value = this._texture;
    
    displayShader.bindUniformsAndAttributes(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}