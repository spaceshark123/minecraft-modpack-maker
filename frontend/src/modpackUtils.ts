import { Mod } from './ModResultsDisplay';
import JSZip from 'jszip';
import Bluebird from 'bluebird';
import { useToast } from "@/hooks/use-toast";

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// remove duplicates from the mod list based on the mod name (if there are 2 mods with the same name but one has an error, keep the one without the error)
export const uniqueMods = (modList: Mod[]): Mod[] => {
	const modMap: Map<string, Mod> = new Map();

	modList.forEach(mod => {
		const modTitle = mod.title || '';
		// If mod already exists and the current mod has an error, skip it
		if (modMap.has(modTitle) && !mod.error) {
			// Replace the mod with the one without the error
			modMap.set(modTitle, mod);
		} else if (!modMap.has(modTitle)) {
			// If mod doesn't exist in the map, add it
			modMap.set(modTitle, mod);
		}
	});

	// Convert the map back to an array
	return Array.from(modMap.values());
}

export const downloadModFile = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download mod from ${url}`);
	}
	const blob = await response.blob();
	return blob;
}

export const zipMods = async (
	zip: JSZip,
	setProgress: (progress: number) => void,
) => {
	return await zip.generateAsync({ type: "blob" }, (metadata) => {
		setProgress(metadata.percent); // Update progress during zipping
	}).catch((error) => {
		return; // return undefined if zipping fails
	});
}

export const handleResponse = (
	response: Response,
	toast: ReturnType<typeof useToast>['toast']
) => {
	if (!response.ok) {
		if (response.status === 429) {
			toast({
				title: 'Too many requests',
				description: 'Please try again later',
				variant: 'destructive'
			});
		} else if (response.status === 403) {
			toast({
				title: 'Forbidden',
				description: 'Please try again later',
				variant: 'destructive'
			});
		} else if (response.status === 504) {
			toast({
				title: 'Gateway Timeout',
				description: 'Please try again later',
				variant: 'destructive'
			});
		} else {
			toast({
				title: 'Error downloading mods',
				description: 'Please try again later',
				variant: 'destructive'
			});
		}
	}
	return response.ok;
}