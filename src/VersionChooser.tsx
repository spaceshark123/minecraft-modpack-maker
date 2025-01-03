import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

function VersionChooser() {
	const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
	const [versions, setVersions] = useState<string[]>([]);
	
	useEffect(() => {
		console.log('Fetching versions');
		// Fetch the JSON file from the public folder
		fetch('/versions/minecraft-versions.json')
		  .then((response) => response.json())
		  .then((data) => {
			setVersions(data);
		  });
		console.log('Fetched versions');
	  }, []);

	return (
		<div className="flex flex-col space-y-1.5 mt-2">
			<Label htmlFor="version">Minecraft Version</Label>
			<Select onValueChange={(value) => setSelectedVersion(value)}>
			<SelectTrigger id="version">
				<SelectValue placeholder="Select Minecraft Version" />
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