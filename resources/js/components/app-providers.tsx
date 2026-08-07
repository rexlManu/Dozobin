import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <TooltipProvider delayDuration={200}>
                {children}
                <Toaster position="bottom-center" />
            </TooltipProvider>
        </ThemeProvider>
    );
}
