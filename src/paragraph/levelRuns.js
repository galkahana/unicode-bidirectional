import includes from 'lodash.includes';

import { Stack, Range, Map, List, Record } from 'immutable';
import { DirectionalStatusStackEntry, EmbeddingLevelState } from '../type';
import { LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI, LRM, RLM, ALM } from '../type';
import { Run } from '../type';
import { increase } from '../type';
import { rle, lre, rlo, lro, rli, lri, fsi, other, pdi, pdf } from './rule/rules';

// BD7.
// [1]: Apply rules X1-X8 to compute the embedding levels
// [2]: Process each character iteratively, applying rules X2 through X8.
// [3]: Each rule has type: (Character, Index, EmbeddingLevelState) -> EmbeddingLevelState
// [4]: Some rules modify the bidi types list and embedding levels
// [5]: Compute the runs by grouping adjacent characters with same the level numbers
//      with the exception of RLE, LRE and PDF which are stripped from output
function levelRuns(codepoints, bidiTypes) {
  const rules = [
    rle,   // X2.
    lre,   // X3.
    //rlo  // X4.
    //lro  // X5.
    rli,   // X5a.
    lri,   // X5b.
    //fsi  // X5c.
    other, // X6.
    pdi,   // X6a.
    pdf    // X7.
  ]; // [1][3]

  const initial = new EmbeddingLevelState() // [1]
    .set('bidiTypes', bidiTypes) // [4]
    .set('embeddingLevels', codepoints.map(__ => 0)); // [4]

  const finalState = codepoints.reduce((state, ch, index) => { // [2]
    return rules.reduce((s, rule) => rule(ch, index, s), state);
  }, initial);

  return codepoints // [5]
    .zip(finalState.get('embeddingLevels'))
    .filter(([c, __]) => includes([LRE, RLE, PDF], c) === false) // X9.
    .reduce((runs, [codepoint, level], index) => {
      const R = runs.size - 1;
      if (runs.getIn([R, 'level'], -1) === level) {
        return runs.updateIn([R, 'to'], increase);
      } else {
        return runs.push(new Run({ level, from: index, to: index + 1 }));
      }
    }, List.of());
}

export default levelRuns;