import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/nav/breadcrumbs";

interface PageTitleProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageTitle({ title, description, actions }: PageTitleProps) {
  return (
    <div className="mb-8">
      <Breadcrumbs className="mb-3" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ui-page-title">{title}</h1>
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
