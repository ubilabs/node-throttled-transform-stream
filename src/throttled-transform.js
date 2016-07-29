/* eslint-disable no-underscore-dangle */
// TODO: use NPM package
import ParallelTransform from '../../node-parallel-transform-stream/dist/parallel-transform'; // eslint-disable-line max-len

export default class ThrottledStream extends ParallelTransform {
  constructor(qps = 35) {
    super(qps, {objectMode: true});

    this.qps = qps;
    this.bucketRunning = false;
    this.queries = 0;
    this.queue = [];
  }

  /**
   * Executed every time data was pushed into the stream
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if it `chunk` is a string
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
   * @param {string}   encoding Encoding, if it `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   * @returns {?} Undefined value to stop execution
   **/
  _processQuery(...query) {
    return this._unthrottled(...query) || this._runThrottled(...query);
  }

  /**
   * Check if this query can be processed without an asynchronous operation.
   * Pushes the result if this succeeded.
   * @param {?}        data Data to be transformed
   * @param {string}   encoding Encoding, if it `chunk` is a string
   * @param {Function} done Callback which must be executed
   *                        when transformations have finished
   * @returns {boolean} True if the query could be completed
   *                    wth a synchronous request
   **/
  _unthrottled(data, encoding, done) {
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
   * @returns {?} Undefined value to stop execution
   **/
  _runThrottled(...query) {
    if (!this.bucketRunning) {
      this._startBucket();
    } else if (this.queries >= this.qps) {
      return this.queue.push(query);
    }

    this.queries++;
    return this._throttledTransform(...query);
  }

  /**
   * Start a timer which will reset the number of
   * queries and drain the queue after 1 second
   **/
  _startBucket() {
    setTimeout(() => {
      this.bucketRunning = false;
      this.queries = 0;
      this._drainQueue();
    }, 1000);
    this.bucketRunning = true;
  }

  /**
   * Remove `qps` items from the queue and process them
   **/
  _drainQueue() {
    this.queue
      .splice(0, this.qps)
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
    throw new Error('Not implemented');
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
