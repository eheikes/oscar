/// <reference path="smr.d.ts" />
import smr = require('smr');

export function calculateCoefficients(rowsOfData: number[][], rowsOfExpectedResults: number[][]): number[] {
  if (rowsOfData.length <= 1) {
    throw new Error('At least 2 rows of data must be specified for MLR.');
  }
  let regression = new smr.Regression({ numX: rowsOfData[0].length, numY: 1 });
  rowsOfData.forEach((vector, i) => {
    regression.push({ x: vector, y: rowsOfExpectedResults[i] });
  });
  let coeffs;
  try {
    coeffs = regression.calculateCoefficients();
  } catch (e) {
    throw new Error(
      'Unable to calculate coefficients for ' +
      JSON.stringify(rowsOfData) + '. Is the matrix singular?'
    );
  }
  return Array.prototype.concat.apply([], coeffs);
}

export default {
  calculateCoefficients
};
