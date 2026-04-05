import React from 'react';
import { autocompleteFilePathSync } from '../../file-mention.js';

function useFileComplete(projectRoot) {
  const [candidates, setCandidates] = React.useState([]);
  const [dropdownIdx, setDropdownIdx] = React.useState(0);

  const updateQuery = React.useCallback(
    (partial) => {
      const results = autocompleteFilePathSync(partial, projectRoot);
      setCandidates(results);
      setDropdownIdx(0);
    },
    [projectRoot]
  );

  const moveUp = React.useCallback(() => setDropdownIdx((i) => Math.max(0, i - 1)), []);
  const moveDown = React.useCallback(
    () =>
      setDropdownIdx((i) => (candidates.length > 0 ? Math.min(candidates.length - 1, i + 1) : 0)),
    [candidates.length]
  );

  const accept = React.useCallback(() => candidates[dropdownIdx] || '', [candidates, dropdownIdx]);

  const reset = React.useCallback(() => {
    setCandidates([]);
    setDropdownIdx(0);
  }, []);

  return { candidates, dropdownIdx, updateQuery, moveUp, moveDown, accept, reset };
}

export { useFileComplete };
