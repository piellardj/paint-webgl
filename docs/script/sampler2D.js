"use strict";

/** Class for generating 2D random samples from a 2D density map */
class Sampler2D {
  /**
   * Create a Sampler2D.
   * @param {array} density - 2D array representing the density map
   */
  constructor(density) {
    this._normalizedLines = [];
    this._cumulatedLines = [];
    
    const nbLines = density.length;
    let total = 0;
    for (let iLine = 0; iLine < nbLines; ++iLine) {
      const densityLine = density[iLine];
      const nbCols = densityLine.length;

      let line = [];
      let lineTotal = 0;
      for (let iCol = 0; iCol < nbCols; ++iCol) {
        const value = Math.max(0, densityLine[iCol]);
        line.push(value);
        lineTotal += value;
      }
      for (let iCol = 0; iCol < nbCols; ++iCol) {
        line[iCol] /= lineTotal;
      }
      this._normalizedLines.push(line);
      this._cumulatedLines.push(lineTotal);
      total += lineTotal;
    }
    for (let iLine = 0; iLine < nbLines; ++iLine) {
      this._cumulatedLines[iLine] /= total;
    }
  }

  /**
   * Generate a 2D random sample using 2 Math.random() calls.
   * @returns A 2D sample in [0,1]x[0,1].
   */
  sample() {
    /* Density is expected to be of normalized sum */
    function sample1D(density) {
      const r = Math.random();
      const length = density.length;
      
      let currentIndex = 0;
      let total = density[0];
      while (r >= total && currentIndex < length-1) {
        currentIndex++;
        total += density[currentIndex];
      }

      return currentIndex + (total - r) / density[currentIndex];
    }
  
    const line = sample1D(this._cumulatedLines);
    const nbLines = this._cumulatedLines.length;
    const lineIndex = Math.min(Math.floor(line), nbLines-1);
    
    const nbCols = this._normalizedLines[lineIndex].length;
    const col = sample1D(this._normalizedLines[lineIndex]);

    return [col / nbCols, line / nbLines];
  }
}
