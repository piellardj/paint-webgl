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
        Page.Range.addObserver(SIZE_CONTROL_ID, updateSize);
        updateSize(Page.Range.getValue(SIZE_CONTROL_ID));
      }
      {
        const SPEED_CONTROL_ID = "speed-range-id";
        const updateSpeed = (speed) => { scene.speed = speed; };
        Page.Range.addObserver(SPEED_CONTROL_ID, updateSpeed);
        updateSpeed(Page.Range.getValue(SPEED_CONTROL_ID));
      }

      {
        const BACKGROUND_CONTROL_ID = "show-background-checkbox-id";
        const updateBackground = (show) => { scene.showBackground = show; };
        Page.Checkbox.addObserver(BACKGROUND_CONTROL_ID, updateBackground);
        updateBackground(Page.Checkbox.isChecked(BACKGROUND_CONTROL_ID));
      }

      {
        const BRUSH_SIZE_CONTROL_ID = "brush-size-range-id";
        const updateBrushSize = (brushSize) => { scene.brushRadius = brushSize; };
        Page.Range.addObserver(BRUSH_SIZE_CONTROL_ID, updateBrushSize);
        updateBrushSize(Page.Range.getValue(BRUSH_SIZE_CONTROL_ID));

        Page.Canvas.Observers.mouseWheel.push(function(delta) {
          const previousValue = Page.Range.getValue(BRUSH_SIZE_CONTROL_ID);
          Page.Range.setValue(BRUSH_SIZE_CONTROL_ID, previousValue + 5 * delta);
          updateBrushSize(Page.Range.getValue(BRUSH_SIZE_CONTROL_ID));
        });
      }

      {
        const SHOW_BRUSH_CONTROL_ID = "show-brush-checkbox-id";
        const updateShowBrush = (show) => { scene.showBrush = show; };
        Page.Checkbox.addObserver(SHOW_BRUSH_CONTROL_ID, updateShowBrush);
        updateShowBrush(Page.Checkbox.isChecked(SHOW_BRUSH_CONTROL_ID));
      }

      {
        const RESILIENCE_CONTROL_ID = "resilience-range-id";
        const updateResilience = (resilience) => { scene.flowResilienceSpeed = resilience; };
        Page.Range.addObserver(RESILIENCE_CONTROL_ID, updateResilience);
        updateResilience(Page.Range.getValue(RESILIENCE_CONTROL_ID));
      }
      {
        const AMOUNT_CONTROL_ID = "amount-range-id";
        const updateAmount = (amount) => { scene.amountFactor = amount; };
        Page.Range.addLazyObserver(AMOUNT_CONTROL_ID, updateAmount);
        updateAmount(Page.Range.getValue(AMOUNT_CONTROL_ID));
      }

      Page.Checkbox.addObserver("indicators-checkbox-id", Page.Canvas.setIndicatorsVisibility);

      Page.Canvas.Observers.mouseMove.push(function(relativeX, relativeY) {
        const canvasSize = Page.Canvas.getSize();
        scene.brushPos = {
          x: relativeX * canvasSize[0],
          y: (1 - relativeY) * canvasSize[1],
        };
      });
    }
  };
  
  return Object.freeze(visible);
  
})();