/* eslint-disable no-unused-expressions */
import test from 'ava';
import sinon from 'sinon';
import ThrottledTransform from '../src/throttled-transform';
import {getThrottledTransformStream} from './lib/helpers';

test.cb('should call a child\'s _throttledTransform function on write', t => { // eslint-disable-line max-len
  const transformStub = sinon.stub().callsArgWith(2),
    ThrottledTransformStub = getThrottledTransformStream(transformStub),
    transformInstance = new ThrottledTransformStub(),
    data = 'some data';

  transformInstance.on('data', () => {});
  transformInstance.on('end', () => {
    t.true(transformStub.calledOnce);
    t.is(transformStub.args[0][0].toString(), data);
    t.end();
  });

  transformInstance.write(data);
  transformInstance.end();
});

test.cb('should emit the _throttledTransform function\'s data', t => {
  const result = 'some result',
    ThrottledTransformStub = getThrottledTransformStream(
      sinon.stub().callsArgWith(2, null, result)
    ),
    transformInstance = new ThrottledTransformStub();

  transformInstance.on('data', data => {
    t.is(data.toString(), result);
  });
  transformInstance.on('end', t.end);

  transformInstance.write('some data');
  transformInstance.end();
});

test('should throw an error when not implementing _throttledTransform', t => {
  class BrokenThrottledTransform extends ThrottledTransform {}
  const transformInstance = new BrokenThrottledTransform();

  t.throws(() => {
    transformInstance.write('some data');
  }, 'Not implemented');
});

test('should allow instantiation via function call', t => {
  const TStream = ThrottledTransform.create(1, (data, encoding, done) => {
    done(null, data);
  });

  t.true(new TStream() instanceof ThrottledTransform);
});
