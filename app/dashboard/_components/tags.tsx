'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export const BreadcrumbTag = () => {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean); // removes empty strings

  const breadcrumbs = segments
    .slice(1) // skip the first segment
    .map((segment, index) => {
      const href = '/' + segments.slice(0, index + 2).join('/');
      return {
        name: decodeURIComponent(segment).replace(/-/g, ' '),
        href,
      };
    });

  return (
    <div className="flex items-center space-x-2 md:px-4 py-2 md:mb-0 mb-5">
      <button
        onClick={() => router.back()}
        className="text-gray-600 hover:text-black transition"
        title="Go back"
      >
        <ChevronLeft size={20} />
      </button>

      <nav className="flex items-center space-x-1 text-sm text-gray-700">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <Link
              href={crumb.href}
              className="hover:underline capitalize"
              aria-current={
                index === breadcrumbs.length - 1 ? 'page' : undefined
              }
            >
              {decodeURIComponent(crumb.name)}
            </Link>
            {index !== segments.length - 2 ? (
              <ChevronRight size={14} className="text-gray-400" />
            ) : null}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};
