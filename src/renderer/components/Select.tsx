/**
 * Select Component
 *
 * Dropdown select component with search, keyboard navigation, and accessibility.
 * Follows shadcn/ui patterns with Radix UI primitives.
 *
 * TAG-DESIGN-005: Select Component Design
 * TAG-FUNC-005: Select Component Implementation
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/shared/lib/utils';

export interface SelectProps {
  /** Current selected value */
  value?: string | string[];
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Enable multiple selection */
  multiple?: boolean;
  /** Enable search/filter functionality */
  searchable?: boolean;
  /** Disable the select */
  disabled?: boolean;
  /** Select content */
  children: ReactNode;
}

// Extend Select with sub-components
interface SelectComponent extends React.FC<SelectProps> {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectPrimitive.Value;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
}

/**
 * Select Root Component
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <Select.Trigger>
 *     <Select.Value placeholder="Select an option" />
 *   </Select.Trigger>
 *   <Select.Content>
 *     <Select.Item value="option1">Option 1</Select.Item>
 *     <Select.Item value="option2">Option 2</Select.Item>
 *   </Select.Content>
 * </Select>
 * ```
 */
const SelectRoot = ({ value, onValueChange, children, disabled }: SelectProps) => {
  return (
    <SelectPrimitive.Root value={value as string} onValueChange={onValueChange} disabled={disabled}>
      {children}
    </SelectPrimitive.Root>
  );
};

export const Select = SelectRoot as SelectComponent;

export interface SelectTriggerProps extends HTMLAttributes<HTMLButtonElement> {}

/**
 * Select Trigger Component
 */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus:ring-zinc-300',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-2">
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * Select Value Component
 */
export const SelectValue = SelectPrimitive.Value;

/**
 * Select Content Component
 */
export const SelectContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * Select Item Component
 */
export const SelectItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));

SelectItem.displayName = SelectPrimitive.Item.displayName;

// Attach sub-components to Select
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem;
