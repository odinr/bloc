import './node_modules/mocha';
import { Bloc } from './node_modules/@codin/bloc';
import { assert } from './node_modules/chai';

type Event = 'increment';

describe('Bloc', function() {
  it('should increment value', function(done) {
    let expected = 0;
    const bloc = new Bloc(0, function*(e: Event, s: number) {
      assert(e === 'increment', 'wrong event');
      expected++;
      yield s + 1;
    });

    bloc.subscribe(
      s => {
        assert(s === expected, 'state not as expected');
        setTimeout(bloc.complete);
      },
      err => done(err),
      done
    );
    bloc.next('increment');
  });
});
