export interface ModPreset {
	id: number
	title: string
	version: string
	modLoader: "Forge" | "Fabric"
	description?: string
	category?: string
	mods: string[]
}

// Function to load presets from JSON file
export async function loadPresets(): Promise<ModPreset[]> {
	try {
		const response = await fetch("/data/presets.json")
		if (!response.ok) throw new Error("Failed to load presets")
		return await response.json()
	} catch (error) {
		console.error("Error loading presets:", error)
		return []
	}
}
