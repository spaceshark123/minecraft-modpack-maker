import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from "@/components/ui/tooltip"
import ThemeToggle from './ThemeToggle.tsx'
import Presets from './Presets.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TooltipProvider>
			<ThemeToggle />
			<Presets />
			<App />
			<Toaster />
		</TooltipProvider>
	</StrictMode>,
)
