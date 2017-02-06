import test from 'ava';

import { parseProgress } from '../src/helpers';


test('wrong raw progress', t => {
  const { downloading, progress, speed } = parseProgress('some wrong raw progress data');
  t.is(downloading, false);
  t.is(progress, 0);
  t.is(speed, 0);
});

test('correct raw progress', t => {
  const { downloading, progress, speed } = parseProgress(
    '[  79%]  .......... .......... .......... .......... ..........  [   3412.9KB/s]'
  );
  t.is(downloading, true);
  t.is(progress, 79);
  t.is(speed, 3412.9);
});