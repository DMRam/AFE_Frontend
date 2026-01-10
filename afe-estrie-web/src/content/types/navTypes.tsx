export type NavNode = {
  id: string;
  label: string;
  href?: string;
  order?: number;
  enabled?: boolean;
  children?: NavNode[];
};

export type NavItem = NavNode;
export type NavChild = NavNode;
