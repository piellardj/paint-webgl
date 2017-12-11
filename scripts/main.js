"use strict";

/**
 * Initializes a WebGL 1 context.
 * @param {HTMLCanvasElement} canvas
 * @param {object} flags
 */
function initGL(canvas, flags) {
  let gl = canvas.getContext("webgl", flags);
  if (!gl) {
    gl = canvas.getContext("experimental-webgl", flags);
    if (!gl) {
      alert("Your browser or device does not seem to support WebGL.");
      return null;
    }
    alert("Your browser or device only supports experimental WebGL.\n" +
      "The simulation may not run as expected.");
  }
    
  canvas.style.cursor = "none";
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  
  Utils.resizeCanvas(gl, false);
  
  return gl;
}

function checkRequirements(gl) {
  const vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  const fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  if (vertexUnits < 3 || fragmentUnits < 4) {
    alert("Your device does not meet the requirements for this simulation.");
    return false;
  }

  const mediump = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
  if (mediump.precision < 23) {
    alert("Your device only supports low precision float in fragment shader.\n" +
      "The simulation will not run.");
    return false;
  }
  
  return true;
}

function main() {
  const canvas = document.getElementById("glcanvas");
  const gl = initGL(canvas);
  if (!gl)
    return;
 
  if (!checkRequirements(gl)) {
    return;
  }
  
  const layers = [
  {background: "rc/portrait/layer0_background.png",
    flowmap: "rc/portrait/layer0_flowmap.txt.png",
    nbParts: 64},
  {background: "rc/portrait/layer1_background.png",
    flowmap: "rc/portrait/layer1_flowmap.txt.png",
    nbParts: 32},
  {background: "rc/portrait/layer2_background.png",
    flowmap: "rc/portrait/layer2_flowmap.txt.png",
    nbParts: 32},
  {background: "rc/portrait/layer3_background.png",
    flowmap: "rc/portrait/layer3_flowmap.txt.png",
    nbParts: 64},
  ];
  
  const scene = new Scene(gl);
  for (let layer of layers) { 
    scene.addLayer(layer.background, layer.flowmap, layer.nbParts);
  }
  
  Controls.bind(gl, canvas, scene);
  
  /* Update the FPS indicator every second. */
  let instantFPS = 0;
  const fpsText = document.getElementById("fps-text");
  const nbPartText = document.getElementById("nb-particles-text");
  const updateIndicators = function() {
    fpsText.textContent = instantFPS.toFixed(0);
    nbPartText.textContent = scene.nbParticles;
  };
  setInterval(updateIndicators, 1000);
  

  let lastUpdate = 0;
  function mainLoop(time) {
    time *= 0.001; //dt is now in seconds
    let dt = time - lastUpdate;
    instantFPS = 1 / dt;
    lastUpdate = time;
    
    /* If the javascript was paused (tab lost focus), the dt may be too big.
     * In that case we adjust it so the simulation resumes correctly. */
    dt = Math.min(dt, 1/10);

    Utils.resizeCanvas(gl, false);
    
    scene.update(dt, time);

    FBO.bindDefault(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    scene.draw(time);

    requestAnimationFrame(mainLoop);
  }
  
  requestAnimationFrame(mainLoop);
}

main();