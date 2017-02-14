import test from 'ava';

import { parseProgress } from '../src/helpers';


test('wrong raw progress', t => {
  const { type } = parseProgress('some wrong raw progress data');
  t.is(type, 'none');
});

test('correct raw progress', t => {
  const { type, data } = parseProgress(
    '[  79%]  .......... .......... .......... .......... ..........  [   3412.9KB/s]'
  );
  t.is(type, 'progress');
  t.is(data.progress, '79');
  t.is(data.speed, '3412.9');
});