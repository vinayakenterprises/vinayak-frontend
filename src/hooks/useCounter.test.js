import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useCounter from './useCounter';

describe('useCounter hook', () => {
  it('should initialize with default value of 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom initialValue', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
    expect(result.current.count).toBe(10);
  });

  it('should increment the counter', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 0 }));
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });

  it('should decrement the counter', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(4);
  });

  it('should reset to initialValue', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(12);

    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(10);
  });

  it('should respect the min boundary constraint', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 2, min: 1 }));
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(1);

    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(1); // capped at 1
  });

  it('should respect the max boundary constraint', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 8, max: 10 }));
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(10);

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10); // capped at 10
  });

  it('should set count directly', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    act(() => {
      result.current.setValue(20);
    });
    expect(result.current.count).toBe(20);
  });
});
