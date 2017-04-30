'use strict';
describe('LMR routines', () => {

  const lmr = require('../build/lmr');

  describe('calculateCoefficients()', () => {

    it('should return an array of coefficients', () => {
      let result = lmr.calculateCoefficients([[1, 2], [5, 6]], [[10], [8]]);
      let expected = [-11, 10.5];
      expect(result).toEqual(expected);
    });

    it('should throw an error for 0 rows of data', () => {
      expect(() => {
        lmr.calculateCoefficients([]);
      }).toThrow();
    });

    it('should throw an error for 1 row of data', () => {
      expect(() => {
        lmr.calculateCoefficients([[1, 2]]);
      }).toThrow();
    });

    it('should throw an error for a non-invertible matrix', () => {
      expect(() => {
        lmr.calculateCoefficients([[0, 0], [0, 0]], [[1], [2]]);
      }).toThrow();
    });

  });

});
