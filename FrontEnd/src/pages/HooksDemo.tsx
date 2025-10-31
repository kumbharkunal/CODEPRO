import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCounter, useExpensiveCalculation, useSearchWithTransition, useDeferredSearch } from '@/hooks/useAdvancedHooks';

export default function HooksDemoPage() {
  // useReducer example
  const { state, increment, decrement } = useCounter();

  // useMemo example
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  const processedData = useExpensiveCalculation(items);

  // useTransition example
  const { query, results, isPending, handleSearch } = useSearchWithTransition();

  // useDeferredValue example
  const [search, setSearch] = useState('');
  const { results: deferredResults, isStale } = useDeferredSearch(search);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">React Hooks Demo</h1>
      <p className="text-muted-foreground">
        Demonstrating all React hooks: useState, useEffect, useContext, useReducer, 
        useMemo, useCallback, useRef, useTransition, useDeferredValue, and custom hooks
      </p>

      {/* useReducer Demo */}
      <Card>
        <CardHeader>
          <CardTitle>useReducer - Complex State Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={decrement}>-</Button>
            <span className="text-2xl font-bold">{state.count}</span>
            <Button onClick={increment}>+</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Using useReducer for predictable state updates
          </p>
        </CardContent>
      </Card>

      {/* useMemo Demo */}
      <Card>
        <CardHeader>
          <CardTitle>useMemo - Expensive Calculations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {processedData.map((item, index) => (
              <div key={index} className="p-2 border rounded">
                Item {item} - Processed: {item.processed ? 'Yes' : 'No'}
              </div>
            ))}
          </div>
          <Button onClick={() => setItems([...items, items.length + 1])}>
            Add Item
          </Button>
          <p className="text-sm text-muted-foreground">
            useMemo prevents recalculating on every render
          </p>
        </CardContent>
      </Card>

      {/* useTransition Demo */}
      <Card>
        <CardHeader>
          <CardTitle>useTransition - Non-blocking Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search (with useTransition)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {isPending && <p className="text-sm text-muted-foreground">Searching...</p>}
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="p-2 border rounded">
                {result}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            useTransition keeps UI responsive during updates
          </p>
        </CardContent>
      </Card>

      {/* useDeferredValue Demo */}
      <Card>
        <CardHeader>
          <CardTitle>useDeferredValue - Debounced Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search (with useDeferredValue)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isStale && <p className="text-sm text-yellow-600">Updating results...</p>}
          <div className="space-y-2">
            {deferredResults.map((result, index) => (
              <div key={index} className="p-2 border rounded">
                {result}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            useDeferredValue defers non-urgent updates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}