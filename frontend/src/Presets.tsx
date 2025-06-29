import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetTrigger
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, BookOpen, Package, FileDown } from "lucide-react"
import { loadPresets, type ModPreset } from "@/lib/presets"
import { toast } from "@/hooks/use-toast"

interface PresetsProps {
	update: (value: string[]) => void; // Function to update the mod list in the parent component
}


function Presets({ update }: PresetsProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [presets, setPresets] = useState<ModPreset[]>([])
	const [activeTab, setActiveTab] = useState("all")

	useEffect(() => {
		loadPresets().then((loadedPresets) => {
			setPresets(loadedPresets)
		})
	}, [])

	const filteredPresets = presets.filter((preset) => {
		const matchesSearch =
			preset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			preset.mods.some((mod) => mod.toLowerCase().includes(searchTerm.toLowerCase()))

		if (activeTab === "all") return matchesSearch
		if (activeTab === "forge") return matchesSearch && preset.modLoader.toLowerCase() === "forge"
		if (activeTab === "fabric") return matchesSearch && preset.modLoader.toLowerCase() === "fabric"
		if (activeTab === "neoforge") return matchesSearch && preset.modLoader.toLowerCase() === "neoforge"
		if (activeTab === "quilt") return matchesSearch && preset.modLoader.toLowerCase() === "quilt"

		return matchesSearch
	})

	const copyToClipboard = (modList: string[]) => {
		const text = modList.join("\n")
		navigator.clipboard.writeText(text)
		toast({
			title: "Copied to clipboard",
			description: "Mod list has been copied to your clipboard",
		})
	}

	const pasteToTextarea = (modList: string[]) => {
		update(modList);
		toast({
			title: "Pasted to textarea",
			description: "Mod list has been pasted to the editable list",
		});
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button className="bg-[#5D7C36] hover:bg-[#4A6329] text-white">
					<BookOpen className="mr-2 h-4 w-4" />
					Browse Mod Presets
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg bg-[#3E3E3E] border-[#5C5C5C]">
				<SheetHeader>
					<SheetTitle className="text-[#E0D4B0]">Mod Presets</SheetTitle>
					<SheetDescription className="text-[#A8A8A8]">
						Browse and select from various mod presets for your Minecraft experience.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-4">
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-[#A8A8A8]" />
						<Input
							placeholder="Search presets or mods..."
							className="pl-8 bg-[#262626] border-[#5C5C5C] text-[#E0D4B0]"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<Tabs defaultValue="all" onValueChange={setActiveTab}>
						<TabsList className="bg-[#262626]">
							<TabsTrigger value="all">All</TabsTrigger>
							<TabsTrigger value="forge">Forge</TabsTrigger>
							<TabsTrigger value="fabric">Fabric</TabsTrigger>
							<TabsTrigger value="neoforge">NeoForge</TabsTrigger>
							<TabsTrigger value="quilt">Quilt</TabsTrigger>
						</TabsList>
					</Tabs>

					<ScrollArea className="h-[500px] pr-4">
						<div className="space-y-4">
							{filteredPresets.length > 0 ? (
								filteredPresets.map((preset) => (
									<div
										key={preset.id}
										className="bg-[#262626] p-4 rounded-lg border border-[#5C5C5C] hover:border-[#7C7C7C] transition-colors"
									>
										<div className="flex justify-between items-start mb-2">
											<h3 className="font-bold text-[#E0D4B0]">{preset.title}</h3>
											<div className="flex gap-2">
												<Badge variant="outline" className="bg-[#3B3B3B] text-[#A8A8A8] border-[#5C5C5C]">
													{preset.version}
												</Badge>
												<Badge
													className={
														preset.modLoader === "Forge"
															? "bg-[#B86A35] hover:bg-[#A05A25]"
															: preset.modLoader === "Fabric"
																? "bg-[#3B82F6] hover:bg-[#2B6CBF]"
																: preset.modLoader === "NeoForge"
																	? "bg-[#6A4B8A] hover:bg-[#5A3B6A]"
																	: preset.modLoader === "Quilt"
																		? "bg-[#FBBF24] hover:bg-[#D69E2E]"
																		: "bg-[#5C5C5C] hover:bg-[#4A4A4A]"
													}
												>
													{preset.modLoader}
												</Badge>
											</div>
										</div>

										<div className="mt-3 mb-4">
											<div className="text-sm text-[#A8A8A8] mb-2 flex items-center">
												<Package className="h-3 w-3 mr-1" />
												<span>{preset.mods.length} mods</span>
											</div>
											<div className="bg-[#1E1E1E] p-2 rounded text-xs text-[#A8A8A8] max-h-[100px] overflow-y-auto">
												{preset.mods.map((mod, index) => (
													<div key={index} className="mb-1 last:mb-0">
														{mod}
													</div>
												))}
											</div>
										</div>

										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												className="text-[#E0D4B0] border-[#5C5C5C] hover:bg-[#4A4A4A] hover:text-[#E0D4B0] bg-transparent"
												onClick={() => copyToClipboard(preset.mods)}
											>
												<Copy className="h-3 w-3 mr-1" />
												Copy
											</Button>
											<Button
												size="sm"
												className="bg-[#5D7C36] hover:bg-[#4A6329] text-white"
												onClick={() => pasteToTextarea(preset.mods)}
											>
												<FileDown className="h-3 w-3 mr-1" />
												Paste to Textarea
											</Button>
										</div>
									</div>
								))
							) : (
								<div className="text-center py-8 text-[#A8A8A8]">No presets found matching your search.</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export default Presets;