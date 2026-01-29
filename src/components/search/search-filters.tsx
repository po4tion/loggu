'use client'

import { Suspense } from 'react'
import { SearchBar } from './search-bar'
import { SortDropdown } from './sort-dropdown'

export function SearchFilters() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Suspense fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-md bg-muted" />}>
        <SearchBar />
      </Suspense>
      <Suspense fallback={<div className="h-10 w-[130px] animate-pulse rounded-md bg-muted" />}>
        <SortDropdown />
      </Suspense>
    </div>
  )
}
