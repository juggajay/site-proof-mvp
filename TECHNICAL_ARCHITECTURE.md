# Technical Architecture Guide - Current Implementation

## **🏗️ Architecture Overview**

Site Proof MVP now implements enterprise-grade architecture patterns with atomic design, strict type safety, and comprehensive error handling.

## **🎨 Atomic Design Implementation**

### **Component Hierarchy**

```typescript
// Atomic Design Structure
components/
├── atoms/           // Basic building blocks
├── molecules/       // Simple combinations
├── organisms/       // Complex sections
└── ui/             // Shadcn/ui primitives
```

### **Atoms** - Basic Building Blocks
```typescript
// components/atoms/loading-spinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  // Implementation with size variants
}
```

### **Molecules** - Component Combinations
```typescript
// Example: Search form molecule
// Combines input atom + button atom + label atom
export function SearchForm() {
  return (
    <form className="flex gap-2">
      <Input placeholder="Search..." />
      <Button type="submit">Search</Button>
    </form>
  );
}
```

### **Organisms** - Complex UI Sections
```typescript
// Example: Project header organism
// Combines multiple molecules and atoms
export function ProjectHeader({ project }: { project: Project }) {
  return (
    <header className="space-y-4">
      <ProjectTitle project={project} />
      <ProjectMetadata project={project} />
      <ProjectActions project={project} />
    </header>
  );
}
```

## **🔒 Type Safety Implementation**

### **Strict TypeScript Configuration**
```json
// tsconfig.json (Enhanced)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/types/*": ["types/*"],
      "@/app/*": ["app/*"],
      "@/contexts/*": ["contexts/*"]
    }
  }
}
```

### **Zod Validation Schemas**
```typescript
// lib/validations/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### **Form Integration with Error Handling**
```typescript
// Enhanced form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/lib/hooks/use-toast';

export function ProjectForm() {
  const { toast } = useToast();
  
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      await createProject(data);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields with automatic validation */}
      </form>
    </Form>
  );
}
```

## **🔔 Toast Notification System**

### **Implementation with Radix UI**
```typescript
// lib/hooks/use-toast.ts
import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast.success(title, { description });
    }
  };

  return { toast };
}
```

### **Toast Integration in Layout**
```typescript
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## **⚡ Async Operation Management**

### **Custom Hook for Loading States**
```typescript
// lib/hooks/use-async-operation.ts
interface UseAsyncOperationReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useAsyncOperation<T>(
  operation: (...args: any[]) => Promise<T>
): UseAsyncOperationReturn<T> {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await operation(...args);
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
    }
  };

  const reset = () => setState({ data: null, loading: false, error: null });

  return { ...state, execute, reset };
}
```

## **📝 Centralized Configuration**

### **Constants File Structure**
```typescript
// lib/constants.ts
export const APP_CONFIG = {
  DATABASE_LIMITS: {
    PROJECT_NAME_MAX: 100,
    DESCRIPTION_MAX: 500,
    ATTACHMENT_SIZE_MAX: 10 * 1024 * 1024, // 10MB
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  TIMEOUTS: {
    API_REQUEST: 30000,
    FILE_UPLOAD: 60000,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  LOTS: '/lots',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;
```

## **🛡️ Error Handling Patterns**

### **Form Error Handler**
```typescript
// lib/utils/form-error-handler.ts
import { toast } from '@/lib/hooks/use-toast';

interface FormErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function handleFormError(
  error: unknown,
  options: FormErrorHandlerOptions = {}
): string {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = ERROR_MESSAGES.GENERIC
  } = options;

  let message = fallbackMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (logError) {
    console.error('Form error:', error);
  }

  if (showToast) {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }

  return message;
}
```

## **📊 Database Integration Patterns**

### **Type-Safe Supabase Operations**
```typescript
// lib/database/projects.ts
import { supabase } from '@/lib/supabase';
import type { Project, CreateProjectInput } from '@/types/database';

export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

export async function getProjects(
  organizationId: string
): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data || [];
}
```

## **🎯 Performance Optimizations**

### **Component Optimization Patterns**
```typescript
// Memoized components for better performance
import { memo } from 'react';

export const ProjectCard = memo<ProjectCardProps>(({ project }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {project.description}
      </CardContent>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';
```

### **Optimized Import Structure**
```typescript
// Clean absolute imports throughout codebase
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';
import { createProjectSchema } from '@/lib/validations/project';
import { APP_CONFIG } from '@/lib/constants';
import type { Project } from '@/types/database';
```

## **🔄 Development Workflow**

### **Git Workflow**
1. **Feature branches** from main
2. **Atomic commits** with descriptive messages
3. **Code review** process
4. **Automated deployment** via Vercel

### **Code Quality Checks**
```bash
# Pre-commit checks
npm run lint        # ESLint
npm run type-check  # TypeScript
npm run build       # Build verification
```

### **Development Commands**
```bash
# Development workflow
npm run dev         # Start with hot reload
npm run build       # Production build
npm run start       # Production preview
```

## **📈 Monitoring & Observability**

### **Error Tracking**
- Console logging for development
- Toast notifications for user feedback
- Graceful error boundaries prevent crashes

### **Performance Monitoring**
- Next.js built-in analytics
- Vercel deployment metrics
- User experience monitoring via loading states

## **🚀 Future Architecture Considerations**

### **Phase 1: Testing Infrastructure**
- Jest + React Testing Library setup
- Component testing patterns
- API integration testing

### **Phase 2: Advanced Performance**
- React.memo optimization
- Code splitting strategies
- Advanced caching patterns

### **Phase 3: Scalability**
- Micro-frontends consideration
- Advanced state management
- Real-time features with Supabase subscriptions

---

**Current Status**: ✅ Enterprise-grade foundation implemented | 🚀 Ready for rapid feature development