/**
 * Make a Moving Average.
 * Returns a sample-collecting function that takes
 * a new value and returns the moving average of
 * all values thus far.
 */
export function makeMa() {
  let avg = 0, count = 0;
  return val => avg += (1 / ++count) * (val - avg);
}

/**
 * Make an Exponentially Weighted Moving Average.
 * Returns a sample-collecting function that takes
 * an alpha value and a sample value, and returns
 * the EWMA of all samples thus far.
 * See the baseAlpha function for how to calculate
 * an alpha value from a half life.
 */
export function makeEwma() {
  let est = 0;
  return (a, val) => {
    if (!est) est = val;
    return est = val * (1 - a) + a * est;
  }
}

/**
 * Calculates an alpha value for a given half life.
 */
export function baseAlpha(halfLife) {
  return Math.exp(Math.log(0.5) / halfLife);
}

/**
 * Make an adjusted Exponentially Weighted Moving Average.
 * Takes a base alpha at its initialization and returns a
 * sample-collecting function that takes an alpha weight
 * factor and a value.
 * This allows samples to be given varying weights.
 */
export function makeAdjEwma(alpha) {
  const ewma = makeEwma();
  return (weight, value) => ewma(alpha ** weight, value);
}
