'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard/home',
    });
    
    // Skip the 'dashboard' segment since we already added it
    const routeSegments = segments.slice(1);
    let currentPath = '/dashboard';
    
    for (let i = 0; i < routeSegments.length; i++) {
      const segment = routeSegments[i];
      currentPath += `/${segment}`;
      
      // Check if this is the last segment (current page)
      const isCurrentPage = i === routeSegments.length - 1;
      
      // Generate label based on segment
      const label = generateLabel(segment, routeSegments, i);
      
      breadcrumbs.push({
        label,
        href: isCurrentPage ? undefined : currentPath,
        isCurrentPage,
      });
    }
    
    return breadcrumbs;
  };
  
  const generateLabel = (segment: string, allSegments: string[], index: number): string => {
    // Handle dynamic routes and special cases
    switch (segment) {
      case 'courses':
        return 'Courses';
      case 'library':
        return 'Library';
      case 'analytics':
        return 'Analytics';
      case 'profile':
        return 'Profile';
      case 'subscription':
        return 'Subscription';
      case 'class':
        return 'Live Class';
      case 'room':
        return 'Room';
      case 'portal':
        return 'Assignments';
      case 'home':
        return 'Educators';
      default:
        // Handle dynamic segments (IDs)
        if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^[0-9]+$/)) {
          // This is likely an ID, try to determine context
          const prevSegment = allSegments[index - 1];
          switch (prevSegment) {
            case 'courses':
              return 'Course';
            case 'home':
              return 'Educator Profile';
            case 'portal':
              return 'Assignment Details';
            case 'class':
              return 'Live Session';
            case 'room':
              return 'Room Details';
            default:
              return 'Details';
          }
        }
        
        // Handle level IDs in courses (courseId/levelId pattern)
        if (allSegments[index - 2] === 'courses' && allSegments[index - 1]?.match(/^[a-f0-9-]{36}$/)) {
          return 'Level Content';
        }
        
        // Default: capitalize and replace hyphens/underscores
        return segment
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs if we're just on dashboard root
  if (breadcrumbs.length <= 1 || pathname === '/dashboard') {
    return null;
  }
  
  return (
    <nav 
      className={cn(
        'flex items-center space-x-1 text-sm text-gray-600 mb-4 px-1',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 mx-2 text-gray-400" />
            )}
            
            {index === 0 && (
              <Home className="h-3.5 w-3.5 mr-2 text-gray-500" />
            )}
            
            {item.isCurrentPage ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href!}
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}