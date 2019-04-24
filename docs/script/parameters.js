"use strict";

/**
 * Module used for binding HTML inputs with the Javascript objects of
 * the simulation.
 */
var Parameters = (function(){
  /* Public static methods */
  let visible = {
    /**
     * @param {Scene} scene
     */
    bind: function (scene) {
      {
        const SIZE_CONTROL_ID = "size-range-id";
        const updateSize = (size) => { scene.strokeSize = size; };
        Range.addObserver(SIZE_CONTROL_ID, updateSize);
        updateSize(Range.getValue(SIZE_CONTROL_ID));
      }
      {
        const SPEED_CONTROL_ID = "speed-range-id";
        const updateSpeed = (speed) => { scene.speed = speed; };
        Range.addObserver(SPEED_CONTROL_ID, updateSpeed);
        updateSpeed(Range.getValue(SPEED_CONTROL_ID));
      }

      {
        const BACKGROUND_CONTROL_ID = "show-background-checkbox-id";
        const updateBackground = (show) => { scene.showBackground = show; };
        Checkbox.addObserver(BACKGROUND_CONTROL_ID, updateBackground);
        updateBackground(Checkbox.isChecked(BACKGROUND_CONTROL_ID));
      }

      {
        const BRUSH_SIZE_CONTROL_ID = "brush-size-range-id";
        const updateBrushSize = (brushSize) => { scene.brushRadius = brushSize; };
        Range.addObserver(BRUSH_SIZE_CONTROL_ID, updateBrushSize);
        updateBrushSize(Range.getValue(BRUSH_SIZE_CONTROL_ID));

        Canvas.Observers.mouseWheel.push(function(delta) {
          const previousValue = Range.getValue(BRUSH_SIZE_CONTROL_ID);
          Range.setValue(BRUSH_SIZE_CONTROL_ID, previousValue + 5 * delta);
          updateBrushSize(Range.getValue(BRUSH_SIZE_CONTROL_ID));
        });
      }

      {
        const SHOW_BRUSH_CONTROL_ID = "show-brush-checkbox-id";
        const updateShowBrush = (show) => { scene.showBrush = show; };
        Checkbox.addObserver(SHOW_BRUSH_CONTROL_ID, updateShowBrush);
        updateShowBrush(Checkbox.isChecked(SHOW_BRUSH_CONTROL_ID));
      }

      {
        const RESILIENCE_CONTROL_ID = "resilience-range-id";
        const updateResilience = (resilience) => { scene.flowResilienceSpeed = resilience; };
        Range.addObserver(RESILIENCE_CONTROL_ID, updateResilience);
        updateResilience(Range.getValue(RESILIENCE_CONTROL_ID));
      }
      {
        const AMOUNT_CONTROL_ID = "amount-range-id";
        const updateAmount = (amount) => { scene.amountFactor = amount; };
        Range.addLazyObserver(AMOUNT_CONTROL_ID, updateAmount);
        updateAmount(Range.getValue(AMOUNT_CONTROL_ID));
      }

      Checkbox.addObserver("indicators-checkbox-id", Canvas.setIndicatorsVisibility);

      Canvas.Observers.mouseMove.push(function(relativeX, relativeY) {
        const canvasSize = Canvas.getSize();
        scene.brushPos = {
          x: relativeX * canvasSize[0],
          y: (1 - relativeY) * canvasSize[1],
        };
      });
    }
  };
  
  return Object.freeze(visible);
  
})();