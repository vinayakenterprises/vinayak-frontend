import { useState, useCallback } from 'react';

/**
 * A custom hook to manage a numeric counter with optional min/max boundaries.
 * 
 * @param {Object} [options]
 * @param {number} [options.initialValue=0] - Initial value of the counter
 * @param {number} [options.min] - Optional minimum boundary
 * @param {number} [options.max] - Optional maximum boundary
 */
export const useCounter = ({ initialValue = 0, min, max } = {}) => {
  const [count, setCount] = useState(() => {
    let value = initialValue;
    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);
    return value;
  });

  const increment = useCallback(() => {
    setCount((prev) => {
      if (max !== undefined && prev >= max) return prev;
      return prev + 1;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prev) => {
      if (min !== undefined && prev <= min) return prev;
      return prev - 1;
    });
  }, [min]);

  const reset = useCallback(() => {
    let value = initialValue;
    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);
    setCount(value);
  }, [initialValue, min, max]);

  const setValue = useCallback(
    (newValue) => {
      let value = typeof newValue === 'function' ? newValue(count) : newValue;
      if (min !== undefined) value = Math.max(min, value);
      if (max !== undefined) value = Math.min(max, value);
      setCount(value);
    },
    [count, min, max]
  );

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
};

export default useCounter;
