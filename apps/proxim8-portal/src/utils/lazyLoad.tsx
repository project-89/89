import React, { Suspense, lazy, ComponentType } from "react";

interface LazyLoadOptions {
  fallback?: React.ReactNode;
}

/**
 * A utility function for lazy loading components with a suspense boundary
 * @param importFunction A function that returns a promise that resolves to a module with a default export of a React component
 * @param options Options for lazy loading, including a custom fallback component
 * @returns A lazily loaded component wrapped in a Suspense boundary
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFunction);
  const fallback = options.fallback || <DefaultLoadingFallback />;

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Default loading fallback component
 */
export function DefaultLoadingFallback() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}
