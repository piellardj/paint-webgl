"use strict";

/**
 * Module used for binding HTML inputs with the Javascript objects of
 * the simulation.
 */
var Controls = (function(){
  /* Private static attributes */

  /* Private static methods */
  /**
   * @param {HTMLElement} element
   * @param {object} func
   * @param {string} input
   */
  function bindInput(element, func, input) {
    element.addEventListener(input, func, false);
    func();
  }

  /* Public static methods */
  let visible = {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {HTMLCanvasElement} canvas
     * @param {Scene} scene
     */
    bind: function (gl, canvas, scene) {
      function documentToCanvas(vec) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: vec.x - rect.left,
          y: canvas.clientHeight - (vec.y - rect.top)
        };
      }

      const sizeSlider = document.getElementById("size-slider");
      const updateSize = () => {scene.strokeSize = sizeSlider.value; };
      bindInput(sizeSlider, updateSize, "input");
      
      const speedSlider = document.getElementById("speed-slider");
      const updateSpeed = () => { scene.speed = speedSlider.value; };
      bindInput(speedSlider, updateSpeed, "input");
      
      const backgroundCheckbox = document.getElementById("background-checkbox");
      const updateBackground = () =>
        { scene.showBackground = backgroundCheckbox.checked; };
      bindInput(backgroundCheckbox, updateBackground, "change");
      
      const brushSizeSlider = document.getElementById("brush-size-slider");
      const updateBrushSize = () =>
        { scene.brushRadius = brushSizeSlider.value; };
      bindInput(brushSizeSlider, updateBrushSize, "input");
      
      const showBrushCheckbox = document.getElementById("show-brush-checkbox");
      const updateShowBrush = () =>
      { scene.showBrush = showBrushCheckbox.checked; };
      bindInput(showBrushCheckbox, updateShowBrush, "change");
      
      const resilienceSlider = document.getElementById("resilience-slider");
      const updateResilience = () =>
        { scene.flowResilienceSpeed = resilienceSlider.value; };
      bindInput(resilienceSlider, updateResilience, "input");
      
      const amountSlider = document.getElementById("amount-slider");
      const updateAmount = () => { scene.amountFactor = amountSlider.value; };
      bindInput(amountSlider, updateAmount, "change");
      
      document.addEventListener("mousemove", function(e) {
        let pos = { x: e.clientX, y: e.clientY };
        scene.brushPos = documentToCanvas(pos);
        }, false);
      
      canvas.addEventListener("mousedown", function (event) {
          scene.mouseButtonDown = true;
        }, false);
      
      document.body.addEventListener("mouseup", function () {
          scene.mouseButtonDown = false;
        }, false);
    },
  };
  
  return Object.freeze(visible);
  
})();