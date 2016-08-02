import ThrottledTransform from '../../src/throttled-transform';

/**
 * Returns a mock ThrottledTransform stream
 * @param {Function} throttledTransform The transformation function
 * @param {number}   qps The maximum number of queries per second
 * @return {Stream} A ThrottledTransform stream
 **/
export function getThrottledTransformStream(
  throttledTransform = (data, done) => {
    done(null, data);
  }
) {
  class TransformTestClass extends ThrottledTransform {}

  TransformTestClass.prototype // eslint-disable-line no-underscore-dangle
    ._throttledTransform = throttledTransform;

  return TransformTestClass;
}
