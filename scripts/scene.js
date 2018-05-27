"use strict";

const SceneShaders = (function() {
  const brushVertSrc =
`attribute vec2 aCorner; //in {-1,+1}x{-1,+1}

uniform vec2 uBrushSize; //relative, in [0,1]x[0,1]
uniform vec2 uBrushPos; //relative, in [0,1]x[0,1]

varying vec2 toCenter;

void main(void) {
    toCenter = -aCorner;
    
    vec2 pos = uBrushPos + aCorner * uBrushSize;
    
    gl_Position = vec4(2.0 * pos - 1.0, 0, 1);
}`;

  const brushFragSrc =
`precision mediump float;

varying vec2 toCenter;

void main(void) {
    float dist = length(toCenter);
    if (dist < 0.9 || dist > 1.0)
        discard;
    
    const vec3 color = vec3(1);
    
    gl_FragColor = vec4(color, 1.0);
}`;

  let brushShader = null;
  
  function buildBrushShader(gl) {
    if (brushShader === null) {
      brushShader = Shader.fromString(gl, brushVertSrc, brushFragSrc);
      brushShader.a["aCorner"].VBO = VBO.createQuad(gl, -1, -1, +1, +1);
    }
  }
  
  const visible = {
    init: function(gl) {
      buildBrushShader(gl);
    },
    
    displayBrushShader() { return brushShader; }
  };
  
  return Object.freeze(visible);
})();

class LoadingLayer {
  constructor(backgroundFilename, flowmapFilename, baseAmount) {
    this.backgroundImg = new Image();
    this.backgroundImg.src = backgroundFilename;
    
    this.flowmapImg = new Image();
    this.flowmapImg.src = flowmapFilename;
    
    this.baseAmount = baseAmount;
  }
  
  get complete() {
    return this.backgroundImg.complete && this.flowmapImg.complete;
  }
}

class Layer {
  constructor(particles, flowmap, background, baseAmount) {
    this.particles = particles;
    this.flowmap = flowmap;
    this.background = background;
    this.depth = 0;
    this.baseAmount = baseAmount;
  }
}

/**
 * Class Scene is an ordered collection of layers.
 * A layer is made of a flowmap, a background, and particles.
 * Since layers require the loading of images,
 * a Scene has a queue of loading layers, which is emptied
 * as the resources are loaded.
 */
class Scene {
  /**
   * Creates a Scene.
   * @param {WebGLRenderingContext} gl the scene will be bound to this context
   */
  constructor(gl) {
    this.gl = gl;
    
    ParticlesShaders.init(gl);
    BackgroundShaders.init(gl);
    FlowmapShaders.init(gl);
    SceneShaders.init(gl);
        
    this._layers = [];
    this._pending = [];
    this._brushPosInPx = {x: 0, y: 0};
    
    this.brushPos = {x: 300, y: 300};
    this.brushRadius = 40;
    this.amountFactor = 1;
    
    this.mouseButtonDown = false;
    
    this.strokeSize = 1;
    this.showBackground = true;
    this.lifetime = 4;
    this.speed = 1;
    this.flowResilienceSpeed = 0.1;
    this.showBrush = true;
  }

  /**
   * Adjusts the number of particles
   * @param {number} value log of the actual multiplicative factor
   */
  set amountFactor(value) {
    const gl = this.gl;

    if (this._amountFactor !== value) {
      for (let layer of this._layers) {
        let amount = (2**value) * layer.baseAmount;
        layer.particles.init(gl, amount, amount, layer.background.sampler);
      }
      
      this._amountFactor = value;
    }
  }

  /** @returns {number} */
  get amountFactor() {
    return this._amountFactor;
  }

  /**
   * Summed amount of particles.
   * @returns {number}
  */
  get nbParticles() {
    let total = 0;
    for(let i = 0; i < this._layers.length; ++i) {
      total += this._layers[i].particles.nbParticles;
    }
    return total;
  }

  /** @param {number} value */
  set flowResilienceSpeed(value) {
    value = Math.min(1, Math.max(0, value));
    FlowmapShaders.resetShader().u["uFactor"].value = value;
  }

  /** @param {boolean} bool */
  set mouseButtonDown(bool) {
    this._mouseDown = bool;
  }

  /** @returns {boolean} */
  get mouseButtonDown() {
    return this._mouseDown;
  }

  /** @param {Object} pos in pixels */
  set brushPos(pos) {
    const gl = this.gl;
    const size = {x: gl.canvas.clientWidth, y: gl.canvas.clientHeight};
    
    const movement = {x: pos.x - this._brushPosInPx.x, y: pos.y - this._brushPosInPx.y};
    this._brushPosInPx = pos;
    
    const relativePos = [pos.x / size.x, pos.y / size.y];
    const relativeMovement = [movement.x / size.x, movement.y / size.y];
    SceneShaders.displayBrushShader().u["uBrushPos"].value = relativePos;
    FlowmapShaders.changeShader().u["uBrushPos"].value = relativePos;
    FlowmapShaders.changeShader().u["uFlow"].value = relativeMovement;
    
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    if (this.mouseButtonDown) {
      gl.useProgram(FlowmapShaders.changeShader());
      for (let layer of this._layers) {
        layer.flowmap.change(this.gl);
      }
      gl.useProgram(null);
    }
  }

  /** @param {number} radius in pixels */
  set brushRadius(radius) {
    const gl = this.gl;
    const size = [radius / gl.canvas.clientWidth,
      radius / gl.canvas.clientHeight];
      
    SceneShaders.displayBrushShader().u["uBrushSize"].value = size;
    FlowmapShaders.changeShader().u["uBrushSize"].value = size;
  }

  /** @param {number} value */
  set speed(value) {
    this._speed = value;
  }

  /** @returns {number} */
  get lifetime() {
    return ParticlesShaders.updatePosShader().u["uLifetime"].value;
  }

  /** @param {number} value */
  set lifetime(value) {
    
    ParticlesShaders.updatePosShader().u["uLifetime"].value = value;
    ParticlesShaders.updateBirthdateShader().u["uLifetime"].value = value;
    ParticlesShaders.drawShader().u["uLifetime"].value = value;
    for(let layer of this._layers) {
      layer.particles.lifetime = value;
    }
  }

  /** @returns {boolean} */
  get showBackground() {
    return this._showBackground;
  }

  /** @param {boolean} bool */
  set showBackground(bool) {
    this._showBackground = bool;
  }

  /** @param {number} size */
  set strokeSize(size) {
    const dimensions = [20 * size, 5 * size];
    
    let drawShader = ParticlesShaders.drawShader();
    drawShader.u["uStrokeSize"].value = dimensions;
  }

  /**
   * Adds a layer to be loaded.
   * The actual layer will only be created once the background and flowmap
   * images are loaded.
   * @param {string} backgroundFilename
   * @param {string} flowmapFilename
   * @param {number} nbParts
   */
  addLayer(backgroundFilename, flowmapFilename, nbParts) {
    const pending = new LoadingLayer(backgroundFilename, flowmapFilename, nbParts);
    this._pending.push(pending);
  }
  
  updateParticles(dt, time) {
    const gl = this.gl;
    const canvasSize = [gl.canvas.clientWidth, gl.canvas.clientHeight];
    const aspectRatio = canvasSize[0] / canvasSize[1];
    
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    ParticlesShaders.updatePosShader().u["uAspectRatio"].value = aspectRatio;
    ParticlesShaders.updatePosShader().u["uTime"].value = time;
    ParticlesShaders.updatePosShader().u["uDt"].value = this._speed * dt;
    gl.useProgram(ParticlesShaders.updatePosShader());
    for(let layer of this._layers) {
        layer.particles.updatePositions(gl, layer.flowmap);
    }
    
    ParticlesShaders.updateBirthdateShader().u["uTime"].value = time;
    gl.useProgram(ParticlesShaders.updateBirthdateShader());
    for(let layer of this._layers) {
      layer.particles.updateBirthdates(gl);
    }
    
    gl.useProgram(ParticlesShaders.updateLooksShader());
    for(let layer of this._layers) {
      layer.particles.updateLooks(gl, layer.flowmap, layer.background);
      layer.particles.switchBuffers();
    }
    gl.useProgram(null);
  }
  
  updateFlowmaps(dt) {
    const gl = this.gl;
    
    gl.useProgram(FlowmapShaders.resetShader());
    for(let layer of this._layers) {
      layer.flowmap.reset(gl);
    }
    gl.useProgram(null);
  }

  /**
   * Updates the layers:
   * - move particles of existing layers
   * - creates layer if its resources were loaded
   * @param {number} dt time alapsed since the last update
   * @param {number} time time elapsed since the start of the simulation
   */
  update(dt, time) {
    const gl = this.gl;
    
    /* Check if a layer is loaded, if so create it */
    if (this._pending.length > 0) {
      if (this._pending[0].complete) {
        const loaded = this._pending.shift();
        const amount = loaded.baseAmount * (2**this.amountFactor);
        const lifetime = this.lifetime;

        const background = new Background(gl, loaded.backgroundImg);
        const flowmap = new Flowmap(gl, loaded.flowmapImg);
        const particles = new Particles(gl, background.sampler, amount, amount, lifetime);

        const layer = new Layer(particles, flowmap, background,loaded.baseAmount);
        this._layers.push(layer);
        
        for(let i = 0; i < this._layers.length; ++i) {
          let depth = 1 - i / this._layers.length;
          this._layers[i].depth = 0.9 * depth;
        }
      }
    }
    
    this.updateParticles(dt, time);
    this.updateFlowmaps(dt);
  }

  /**
   * Displays the layers, the backgrounds and the brush.
   * @param {number} time time elapsed since the start of the simulation
   */
  draw(time) {
    const gl = this.gl;
    const canvasSize = [gl.canvas.clientWidth, gl.canvas.clientHeight];
    
    /* Display of the particles */
    let drawShader = ParticlesShaders.drawShader();
    drawShader.u["uCanvasSize"].value = canvasSize;
    drawShader.u["uTime"].value = time;
    
    gl.useProgram(drawShader);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    for(let layer of this._layers) {
      drawShader.u["uDepth"].value = layer.depth;
      layer.particles.draw(gl, time);
    }
      
   /* Display of the backgrounds */
    if (this.showBackground && this._layers.length > 0) {
      const displayBackgroundShader = BackgroundShaders.displayShader();
      
      gl.useProgram(displayBackgroundShader);
      gl.enable(gl.BLEND);

      const layer = this._layers[0];
      displayBackgroundShader.u["uDepth"].value = layer.depth;    
      layer.background.draw(gl);
    }
   
    /* Display of the brush */
    if (this.showBrush) {
      const brushShader = SceneShaders.displayBrushShader();
      gl.useProgram(brushShader);
      brushShader.bindUniformsAndAttributes(gl);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    gl.useProgram(null);
  }
}