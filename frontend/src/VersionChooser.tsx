import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"

interface VersionChooserProps {
	update: (value: string | null) => void;
}

function VersionChooser({ update }: VersionChooserProps) {
	const [versions, setVersions] = useState<string[]>([]);

	useEffect(() => {
		console.log('Fetching versions');
		// Fetch the up-to-date versions from the endpoint
		fetch('/api/versions')
			.then((response) => response.json())
			.then((data) => {
				setVersions(data.versions);
			});
		console.log('Fetched versions');
	}, []);

	return (
		<div className="flex flex-col space-y-1.5 mt-2">
			<Label htmlFor="version">Minecraft Version</Label>
			<Select onValueChange={(value) => update(value)}>
				<SelectTrigger id="version">
					<SelectValue placeholder="Select" />
				</SelectTrigger>
				<SelectContent position="popper" className="overflow-y-auto max-h-60">
					{versions.map((version) => (
						<SelectItem key={version} value={version}>{version}</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

export default VersionChooser;