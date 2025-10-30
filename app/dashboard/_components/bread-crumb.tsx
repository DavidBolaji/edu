'use client';

import AppLink from '@/app/_components/app-link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/_components/ui/breadcrumb';
import {
  ArrowBigLeftDash,
  ArrowLeftIcon,
  LucideArrowBigLeftDash,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';

export function DashboardBreadcrumb({
  paths,
}: {
  paths: { name: string; url: string }[];
}) {
  const router = useRouter();
  return (
    <Breadcrumb className="flex md:mb-0 mb-5">
      <span
        className="inline-block mt-0.5 mr-2 cursor-pointer"
        onClick={() => router.back()}
      >
        <ArrowLeftIcon size={18} />
      </span>
      <BreadcrumbList>
        {paths.map((p, index) => (
          <Fragment key={p.name}>
            {index !== paths.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <AppLink href={p.url} className="capitalize cursor-pointer">
                    {p.name}
                  </AppLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbPage className="capitalize cursor-pointer">
                {p.name}
              </BreadcrumbPage>
            )}
            {index !== paths.length - 1 ? <BreadcrumbSeparator /> : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
