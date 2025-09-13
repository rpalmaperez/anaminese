import { ReactNode } from 'react';

// Tipos para componentes de UI
export interface ButtonProps {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  className?: string;
  maxLength?: number;
  minLength?: number;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  multiple?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface RadioProps {
  label?: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload?: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  preview?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackColor?: string;
}

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationProps;
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
    onSort: (column: string, direction: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedRows: string[]) => void;
  };
  actions?: DataTableAction<T>[];
  emptyMessage?: string;
  className?: string;
}

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: (row: T) => boolean;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  loading?: boolean;
  suggestions?: string[];
  className?: string;
}

export interface FilterPanelProps {
  filters: FilterItem[];
  values: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
  onReset: () => void;
  className?: string;
}

export interface FilterItem {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'number' | 'checkbox';
  options?: SelectOption[];
  placeholder?: string;
  multiple?: boolean;
}

export interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  className?: string;
}

export interface ImageCropperProps {
  src: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  className?: string;
}

export interface FormStepperProps {
  steps: FormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  disabled?: boolean;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  className?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'half' | 'full';
  className?: string;
}

export interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}