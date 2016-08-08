# Throttled Transform Stream

A NodeJS transform stream which runs a limited number of transformations per second, in parallel, and preserves input order. Optimised for API queries.

```sh
npm install throttled-transform-stream --save
```

## Usage

```js
import ThrottledTransform from 'throttled-transform-stream';

class MyThrottledTransformStream extends ThrottledTransform {
	constructor() {
		super({queriesPerSecond: 35, objectMode: true});
	}

	_throttledTransform(data, encoding, done) {
		// asynchronous operation
		done(null, data);
	}

	// optional
	_throttledFlush(done) {
		// finish stuff, if required
		done();
	}
}
```

Alternatively, you can use the following shortcut function:

```js
import ThrottledTransform from 'throttled-transform-stream';

const MyThrottledTransformStream = ThrottledTransform.create((data, encoding, done) => {
	// long-running, asynchronous operation
	done(null, data);
});
```

## Documentation

All classes extending the `ThrottledTransform` class must implement the method `_throttledTransform`.  
They may implement `_throttledFlush`, although this is not required.

### API

**ThrottledTransform.create(transform, flush = function(done) { done(); }, defaultOptions = {})**

* `transform` `<Function>` The \_transform function of the stream. [See below](#api-for-extending-throttledtransform) for more details
* `flush` `<Function>` The \_flush function of the stream. [See below](#api-for-extending-throttledtransform) for more details
* `defaultOptions` `<Object>` Default options for the class constructor (`queriesPerSecond`, all options of `stream.Transform`)

### API for extending ThrottledTransform

The constructor of the `ThrottledTransform` class accepts all options accepted by `stream.Transform`. In addition, it accepts the `queriesPerSecond` property, which sets the maximum number of transformations per second.  
The rate limitation follows a *bucket model*: `queriesPerSecond` transformations are started simultaneously. The limitation code then waits until a full second has passed since the first transformation was started, and then starts the next batch of `queriesPerSecond` transformations.

All classes extending `ThrottledTransform` must implement the `_throttledTransform` method, and may implement the `_throttledFlush` method.

**ThrottledTransform._throttledTransform(chunk, encoding, callback)**

* `chunk` `<Buffer>` | `<String>` The chunk to be transformed.
* `encoding` `<String>` If the chunk is a string, then this is the encoding type. If chunk is a buffer, then this is the special value - 'buffer', ignore it in this case.
* `callback` `<Function>` A callback function to be called after the supplied chunk has been processed. The first argument passed to the callback must be an error which has occurred during transformation, or `null`. The second argument is the result. The stream will stop processing transforms and emit an `error` event instantly if the error passed to the callback function was not `null`.

Please note that, as opposed to traditional NodeJS transform streams, you **MUST NOT** call `this.push` directly. Emit values through the callback function instead.  
You **must not** call the callback more than once.

**ThrottledTransform._throttledFlush(callback)**

* `callback` `<Function>` A callback function to be called when the stream has finished flushing.

`ThrottledTransform` implementations may implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the 'end' event is emitted signaling the end of the Readable stream.

**ThrottledTransform._skipThrottle(data, encoding)**

* `data` `<Buffer>` | `<String>` The chunk to be transformed
* `encoding` `<String>` If the chunk is a string, then this is the encoding type. If chunk is a buffer, then this is the special value - 'buffer', ignore it in this case.

This function is executed for every value written to the stream before the `_throttledTransform` function is executed with the same value. If this function returns a truthy value it will be emitted immediately, and the execution of `_throttledTransform` will be skipped. This functionality can be useful for implementing caches or similar mechanisms. If this method is not implemented, it will default to return `false`.

### Gotchas and caveats

* Calling `this.push()` will result in unexpected behaviour. Push results by calling `done(null, result)`.
* Calling `done()` more than once will result in unexpected behaviour
* By design, you cannot push multiple results from a single transform
