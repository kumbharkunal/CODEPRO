import { 
  useReducer, 
  useMemo, 
  useCallback, 
  useTransition, 
  useDeferredValue,
  useState
} from 'react';

// Example 1: useReducer for complex state
interface State {
  count: number;
  loading: boolean;
  error: string | null;
}

type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'setError'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'setError':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export const useCounter = () => {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    loading: false,
    error: null,
  });

  // useCallback - memoize functions
  const increment = useCallback(() => {
    dispatch({ type: 'increment' });
  }, []);

  const decrement = useCallback(() => {
    dispatch({ type: 'decrement' });
  }, []);

  return { state, increment, decrement };
};

// Example 2: useMemo for expensive calculations
export const useExpensiveCalculation = (data: any[]) => {
  // useMemo - only recalculate when data changes
  const processedData = useMemo(() => {
    console.log('Processing data...');
    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now(),
    }));
  }, [data]);

  return processedData;
};

// Example 3: useTransition for non-blocking updates
export const useSearchWithTransition = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    // Mark this update as non-urgent
    startTransition(() => {
      // Simulate expensive search
      const filtered = mockData.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
    });
  }, []);

  return { query, results, isPending, handleSearch };
};

const mockData = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

// Example 4: useDeferredValue for debouncing
export const useDeferredSearch = (searchTerm: string) => {
  // Defer the value to keep UI responsive
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // This will only update after other urgent updates
  const results = useMemo(() => {
    return mockData.filter(item =>
      item.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    );
  }, [deferredSearchTerm]);

  return { results, isStale: searchTerm !== deferredSearchTerm };
};