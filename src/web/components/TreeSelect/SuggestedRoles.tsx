import { UI_IDS } from '@/ui-ids.js';

interface SuggestedRolesProps {
  roles: string[];
  domain?: string | null;
  treeLabel?: string | null;
}

export function SuggestedRoles({ roles, domain, treeLabel }: SuggestedRolesProps) {
  if (roles.length === 0) return null;

  const headerSuffix = [domain, treeLabel].filter(Boolean).join(' × ');

  return (
    <div className="bg-muted/40 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2" data-ui-id={UI_IDS.TREE_PATH_ROLE_CHIPS}>
      <span className="text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">추천 역할{headerSuffix && ` · ${headerSuffix}`}</span>
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <span key={role} className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-card text-[11.5px] text-secondary-foreground">
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
