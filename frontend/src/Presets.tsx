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
				<Button className="dark:bg-[#5D7C36] dark:hover:bg-[#4A6329] dark:text-white text-black bg-[#E0D4B0] hover:bg-[#D0C18A]">
					<BookOpen className="mr-2 h-4 w-4" />
					Browse Mod Presets
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg">
				<SheetHeader>
					<SheetTitle className="font-extrabold">Mod Presets</SheetTitle>
					<SheetDescription className="dark:text-[#A8A8A8] text-[#949494]">
						Browse and select from various mod presets for your Minecraft experience.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-4">
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 dark:text-[#A8A8A8] text-[#949494]" />
						<Input
							placeholder="Search presets or mods..."
							className="pl-8 dark:bg-[#262626] dark:border-[#5C5C5C] dark:text-[#A8A8A8] text-[#949494] bg-[#ececec] border-[#8e8e8e]"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<Tabs defaultValue="all" onValueChange={setActiveTab} className="relative">
						<TabsList className="dark:bg-[#262626] bg-[#f0f0f0] relative overflow-hidden grid grid-cols-5 h-[2.5rem]">
							<div
								className="absolute top-0 bottom-0 dark:bg-white bg-[#969696] rounded-sm transition-all duration-300 ease-out"
								style={{
									width: "20%",
									left:
										activeTab === "all"
											? "0%"
											: activeTab === "forge"
												? "20%"
												: activeTab === "fabric"
													? "40%"
													: activeTab === "neoforge"
														? "60%"
														: "80%",
								}}
							/>
							<TabsTrigger value="all" className="tab relative z-10 data-[state=active]:bg-transparent dark:data-[state=active]:text-black data-[state=active]:text-white">All</TabsTrigger>
							<TabsTrigger value="forge" className="tab relative z-10 data-[state=active]:bg-transparent dark:data-[state=active]:text-black data-[state=active]:text-white">Forge</TabsTrigger>
							<TabsTrigger value="fabric" className="tab relative z-10 data-[state=active]:bg-transparent dark:data-[state=active]:text-black data-[state=active]:text-white">Fabric</TabsTrigger>
							<TabsTrigger value="neoforge" className="tab relative z-10 data-[state=active]:bg-transparent dark:data-[state=active]:text-black data-[state=active]:text-white">NeoForge</TabsTrigger>
							<TabsTrigger value="quilt" className="tab relative z-10 data-[state=active]:bg-transparent dark:data-[state=active]:text-black data-[state=active]:text-white">Quilt</TabsTrigger>
						</TabsList>
					</Tabs>

					<ScrollArea className="pr-4" style={{ height: 'calc(100vh - 250px)' }}>
						<div className="space-y-4">
							{filteredPresets.length > 0 ? (
								filteredPresets.map((preset) => (
									<div
										key={preset.id}
										className="dark:bg-[#161616] p-4 rounded-lg border dark:border-[#333333] dark:hover:border-[#5f5f5f] transition-colors bg-[#efefef] border-[#d0d0d0] hover:border-[#ababab]"
									>
										<div className="flex justify-between items-start mb-2">
											<h3 className="font-extrabold dark:text-[#E0D4B0] text-[#6b6561]">{preset.title}</h3>
											<div className="flex gap-2">
												<Badge variant="outline" className="dark:bg-[#292929] dark:text-[#a8a8a8] dark:border-[#5C5C5C] bg-[#e2e2e2] text-[#5f5f5f] border-[#c4c4c4]">
													{preset.version}
												</Badge>
												<Badge
													className={
														(preset.modLoader === "Forge"
															? "bg-[#ff8432] hover:bg-[#ea823d]"
															: preset.modLoader === "Fabric"
																? "bg-[#6ba4ff] hover:bg-[#6798d7]"
																: preset.modLoader === "NeoForge"
																	? "bg-[#dcaaff] hover:bg-[#ac85c8]"
																	: preset.modLoader === "Quilt"
																		? "bg-[#FBBF24] hover:bg-[#D69E2E]"
																		: "bg-[#5C5C5C] hover:bg-[#4A4A4A]"
														) + " font-bold"}
												>
													{preset.modLoader}
												</Badge>
											</div>
										</div>

										<div className="mt-3 mb-4">
											<div className="text-sm dark:text-[#A8A8A8] text-[#797979] mb-2 flex items-center">
												<Package className="h-3 w-3 mr-1" />
												<span>{preset.mods.length} mods</span>
											</div>
											<div className="dark:bg-[#1E1E1E] bg-[#dddddd] p-2 rounded text-xs dark:text-[#A8A8A8] text-[#6c6c6c] max-h-[100px] overflow-y-auto">
												{preset.mods.map((mod, index) => (
													<div key={index} className="mb-1 last:mb-0 font-normal">
														{mod}
													</div>
												))}
											</div>
										</div>

										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												className="dark:text-[#E0D4B0] text-[#6b6561] dark:border-[#5C5C5C] border-[#d2d2d2] dark:hover:bg-[#303030] hover:bg-[#dfdfdf] dark:hover:text-[#E0D4B0] bg-transparent"
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
												Paste to Mods List
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