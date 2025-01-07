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
import { FabricIcon, ForgeIcon, NeoForgeIcon, QuiltIcon } from './ModLoaderIcons'

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
					<SelectItem value="forge">
						<ForgeIcon className="w-4 h-4 mr-2 inline" />
						<span>Forge</span>
					</SelectItem>
					<SelectItem value="fabric" className="flex items-center">
						<FabricIcon className="w-4 h-4 mr-2 inline" />
						<span>Fabric</span>
					</SelectItem>
					<SelectItem value="neoforge">
						<NeoForgeIcon className="w-4 h-4 mr-2 inline" />
						<span>NeoForge</span>
					</SelectItem>
					<SelectItem value="quilt">
						<QuiltIcon className="w-4 h-4 mr-2 inline" />
						<span>Quilt</span>
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}

export default ModLoaderChooser;
