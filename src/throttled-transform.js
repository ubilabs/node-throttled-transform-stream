/* eslint-disable no-underscore-dangle */
import ParallelTransform from 'parallel-transform-stream';

const _qps = new WeakMap(),
  _bucketRunning = new WeakMap(),
  _queriesRunning = new WeakMap(),
  _queue = new WeakMap();

export default class ThrottledTransform extends ParallelTransform {
  /**
   * ThrottledTransform instance
   * All child classes must implement the `_throttledTransform` function.
   * Child classes should not implement the `_transform` and `_flush` functions.
   *
   * @param {Object} options Options which will be passed to the
   *                         `stream.Transform` constructor
   **/
  constructor(options = {}) {
    const queriesPerSecond = options.queriesPerSecond || 35,
      defaultOptions = {
        maxParallel: queriesPerSecond
      };

    super(Object.assign({}, defaultOptions, options));

    _qps.set(this, queriesPerSecond);
    _bucketRunning.set(this, false);
    _queriesRunning.set(this, 0);
    _queue.set(this, []);
  }

  /**
   * Helper function for easily creating ThrottledTransform streams
   *
   * @param {Function} transform The stream's _transform function
   * @param {Function} flush The stream's _flush function
   * @param {Object} defaultOptions Default options for the class constructor
   * @returns {Class} A ParallelTransform class
   **/
  static create(transform, flush = done => done(), defaultOptions = {}) {
    class Transform extends ThrottledTransform {
      constructor(options) {
        super(Object.assign({}, defaultOptions, options));
      }

      _throttledTransform = transform;
      _throttledFlush = flush;
    }

    return Transform;
  }

  /**
   * Executed every time data was pushed into the stream
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   **/
  _parallelTransform(...query) {
    this._processQuery(...query);
  }

  /**
   * Run this query, either unthrottled
   * (if _skipThrottle is implemented and returned true), or throttled.
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   * @returns {?} Undefined value to stop execution
   **/
  _processQuery(...query) {
    return this._runUnthrottled(...query) || this._runThrottled(...query);
  }

  /**
   * Check if this query can be processed without an asynchronous operation.
   * Pushes the result if this succeeded.
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   * @returns {boolean} True if the query could be completed
   *                    wth a synchronous request
   **/
  _runUnthrottled(data, encoding, done) {
    const result = this._skipThrottle(data, encoding);
    if (result) {
      done(null, result);
      return true;
    }

    return false;
  }

  /**
   * Run a query if there is a slot available.
   * Otherwise add it to the queue.
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   * @returns {?} Undefined value to stop execution
   **/
  _runThrottled(...query) {
    if (!_bucketRunning.get(this)) {
      this._startBucket();
    } else if (_queriesRunning.get(this) >= _qps.get(this)) {
      return _queue.get(this).push(query);
    }

    _queriesRunning.set(this, _queriesRunning.get(this) + 1);
    return this._throttledTransform(...query);
  }

  /**
   * Start a timer which will reset the number of
   * queries and drain the queue after 1 second
   **/
  _startBucket() {
    setTimeout(() => {
      _bucketRunning.set(this, false);
      _queriesRunning.set(this, 0);
      this._drainQueue();
    }, 1000);
    _bucketRunning.set(this, true);
  }

  /**
   * Remove `qps` items from the queue and process them
   **/
  _drainQueue() {
    _queue.get(this)
      .splice(0, _qps.get(this))
      .forEach(query => {
        this._processQuery(...query);
      });
  }

  /**
   * The _transform function of the ThrottledTransform stream
   * This function must be overriden by child classes
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   **/
  _throttledTransform(data, encoding, done) { // eslint-disable-line no-unused-vars, max-len
    throw new Error('_throttledTransform not implemented');
  }

  /**
   * The _skipThrottle function of the ThrottledTransform stream
   * If this function returns a truthy value, the return value of
   * this function will be pushed to the stream immediately.
   * This is especially useful for implementing a cache, which could
   * check if an API call is actually required
   * @param {?}      data Data to be transformed
   * @param {string} encoding Encoding, if `chunk` is a string
   * @returns {?}    Falsy value if the _throttledTransform
   *                 function should be executed.
   *                 Data to be pushed to the stream otherwise
   **/
  _skipThrottle(data, encoding) { // eslint-disable-line no-unused-vars
    return false;
  }

  /**
   * The _flush function of the ThrottledTransform stream
   * This function may optionally be overriden by child classes
   * @param {Function} done Callback which must be executed
   *                        when finished
   **/
  _throttledFlush(done) {
    done();
  }

  /**
   * The _flush function of the stream
   * @param {Function} done Callback which must be executed
   *                        when finished
   **/
  _parallelFlush(done) {
    this._throttledFlush(done);
  }
}
