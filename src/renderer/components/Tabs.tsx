/**
 * Tabs Component
 *
 * Tabbed interface with animated switching and keyboard navigation.
 * Follows shadcn/ui patterns with Radix UI primitives.
 *
 * TAG-DESIGN-006: Tabs Component Design
 * TAG-FUNC-006: Tabs Component Implementation
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/shared/lib/utils';

export interface TabsProps {
  /** Currently active tab value (controlled) */
  value?: string;
  /** Initial active tab value (uncontrolled) */
  defaultValue?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Tabs content */
  children: ReactNode;
}

// Extend Tabs with sub-components
interface TabsComponent extends React.FC<TabsProps> {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
}

/**
 * Tabs Root Component
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <Tabs.List>
 *     <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
 *     <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="tab1">Content 1</Tabs.Content>
 *   <Tabs.Content value="tab2">Content 2</Tabs.Content>
 * </Tabs>
 * ```
 */
const TabsRoot = ({ value, defaultValue, onValueChange, children }: TabsProps) => {
  return (
    <TabsPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      {children}
    </TabsPrimitive.Root>
  );
};

export const Tabs = TabsRoot as TabsComponent;

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Tabs List Component
 */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
        className
      )}
      {...props}
    />
  )
);

TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  /** Unique value for this tab */
  value: string;
}

/**
 * Tabs Trigger Component
 */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-zinc-50',
        className
      )}
      {...props}
    />
  )
);

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Value that matches a trigger */
  value: string;
}

/**
 * Tabs Content Component
 */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300',
        className
      )}
      {...props}
    />
  )
);

TabsContent.displayName = TabsPrimitive.Content.displayName;

// Attach sub-components to Tabs
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
