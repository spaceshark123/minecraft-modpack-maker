import { useState, useEffect } from "react"
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

interface SiteSelectorProps {
	selectedSites: string[];
	update: (value: string[]) => void;
}

function SiteSelector({ selectedSites, update }: SiteSelectorProps) {

	const handleSiteToggle = (siteId: string) => {
		if (siteId === "placeholder") return; // Do nothing for placeholder
		if (selectedSites.includes(siteId)) {
			if(selectedSites.length !== 1) { // If there is only one site selected, don't allow it to be unselected
				update(selectedSites.filter((id) => id !== siteId));
			}
		} else {
			update([...selectedSites, siteId]);
		}
	};

	useEffect(() => {
		if (selectedSites.length === 0) {
			update(["modrinth"]); // Default to Modrinth
		}
	}, []);

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
						disabled={site.id === "placeholder" || site.id === "curseforge"}
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