import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const sites = [
	{ id: "placeholder", name: "Choose websites..." },
	{ id: "modrinth", name: "Modrinth" },
	{ id: "curseforge", name: "Curseforge" },
]

function SiteSelector() {
	const [selectedSites, setSelectedSites] = useState<string[]>([])

	const handleSiteToggle = (siteId: string) => {
		if (siteId === "placeholder") return; // Do nothing for placeholder
		setSelectedSites((prev) => {
			if (prev.includes(siteId)) {
				// Prevent unchecking if it's the only selected site
				if (prev.length === 1) return prev;
				return prev.filter((id) => id !== siteId);
			} else {
				return [...prev, siteId];
			}
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="w-full justify-start">
					{selectedSites.length === 0
						? sites.find((site) => site.id === "placeholder")?.name
						: selectedSites.length === 1
							? sites.find((site) => site.id === selectedSites[0])?.name
							: selectedSites.map((siteId) => sites.find((site) => site.id === siteId)?.name).join(" + ")
					}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[200px]">
				{sites.map((site) => (
					<DropdownMenuCheckboxItem
						key={site.id}
						checked={selectedSites.includes(site.id)}
						onCheckedChange={() => handleSiteToggle(site.id)}
						disabled={site.id === "placeholder"}
					>
						<span className="flex items-center">
							{site.name}
						</span>
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default SiteSelector