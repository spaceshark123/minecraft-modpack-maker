import { useState } from 'react'
import './App.css'
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"

interface ModLoaderChooserProps {
	update: (value: string | null) => void;
}

function ModLoaderChooser({ update }: ModLoaderChooserProps) {
	return (
		<div className="flex flex-col space-y-1.5">
			<Label htmlFor="loader">Mod Loader</Label>
			<Select onValueChange={(value) => update(value as string)}>
				<SelectTrigger id="loader">
					<SelectValue placeholder="Select" />
				</SelectTrigger>
				<SelectContent position="popper">
					<SelectItem value="forge">Forge</SelectItem>
					<SelectItem value="fabric">Fabric</SelectItem>
					<SelectItem value="neoforge">NeoForge</SelectItem>
					<SelectItem value="quilt">Quilt</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}

export default ModLoaderChooser;
