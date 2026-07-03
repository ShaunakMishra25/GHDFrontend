import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useRefreshOnFocus(refetch: () => void) {
  const firstLoad = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstLoad.current) {
        firstLoad.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
