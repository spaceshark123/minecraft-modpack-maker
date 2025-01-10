import { useState } from 'react';
import './App.css';
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Package, Ban, Check, List, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ModLoaderChooser from './ModLoaderChooser';
import ModsInput from './ModsInput';
import VersionChooser from './VersionChooser';
import WebsiteSelector from './WebsiteSelector';
import ModResultsDisplay, { Mod } from './ModResultsDisplay';
import { Progress } from '@/components/ui/progress';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Bluebird from "bluebird";

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function App() {
	const [mods, setMods] = useState<string[]>([]);
	const [selectedLoader, setSelectedLoader] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
	const [selectedSites, setSelectedSites] = useState<string[]>([]);

	const [modResults, setModResults] = useState<any[]>([]);  // Store fetched mod data
	const [loading, setLoading] = useState<boolean>(false);   // Track loading state
	const [loadingTitle, setLoadingTitle] = useState<string>('');  // Loading title
	const [progress, setProgress] = useState<number>(0);      // Progress state

	const [panelOpen, setPanelOpen] = useState(false);

	const { toast } = useToast();

	const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);

	// remove duplicates from the mod list based on the mod name (if there are 2 mods with the same name but one has an error, keep the one without the error)
	const uniqueMods = (modList: Mod[]): Mod[] => {
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

	const downloadModFile = async (url: string) => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download mod from ${url}`);
		}
		const blob = await response.blob();
		return blob;
	}

	const constructModpack = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		let workingMods = mods;

		// remove duplicate mods
		workingMods = [...new Set(workingMods)];
		console.log("removed duplicates", workingMods);

		let valid = true;
		if (workingMods.length === 0) {
			console.log('No mods provided');
			toast({
				title: 'No mods provided',
				description: 'Please provide at least one mod name',
				variant: 'destructive'
			});
			valid = false;
		}
		if (!selectedLoader) {
			console.log('No loader selected');
			toast({
				title: 'No loader selected',
				description: 'Please select a mod loader',
				variant: 'destructive'
			});
			valid = false;
		}
		if (!selectedVersion) {
			console.log('No version selected');
			toast({
				title: 'No version selected',
				description: 'Please select a Minecraft version',
				variant: 'destructive'
			});
			valid = false;
		}
		if (!valid) return;

		setPanelOpen(true);  // Open the panel
		setLoadingTitle('Fetching Mods...');  // Set loading title
		setLoading(true);  // Set loading to true when starting requests
		setModResults([]);  // Reset mod results
		setProgress(0);     // Reset progress

		let modsList = [];
		for (let i = 0; i < workingMods.length; i++) {
			const mod = workingMods[i];

			// For each mod, make a request to the backend to get the mod data
			const url = `/api/mod/modrinth?name=${mod}&version=${selectedVersion}&loader=${selectedLoader}`;
			const response = await fetch(url);
			if (response.status === 429) {
				toast({
					title: 'Too many requests',
					description: 'Please try again later',
					variant: 'destructive'
				});
				setModResults([]);  // Clear mod results
				setPanelOpen(false);  // Close the panel
				setLoading(false);    // Stop loading
				return;
			} else if (response.status === 404) {
				toast({
					description: `${mod} not found`,
					variant: 'destructive'
				});
				modsList.push({ title: mod, error: true });
			} else {
				const data = await response.json();
				modsList.push(data);
			}

			// Update progress after each mod fetch
			setProgress(((i + 1) / workingMods.length) * 100);
			// sleep for a random time above 200s to avoid rate limiting of 300 requests per minute
			await sleep(Math.floor(Math.random() * 200) + 200);
		}
		modsList = uniqueMods(modsList); // Remove duplicates

		console.log(modsList);

		setModResults(modsList);  // Store the fetched mod results
		setLoading(false);        // Stop loading after requests finish
	};

	const handleDownload = async () => {
		let modDownloadUrls: string[] = [];
		let modFilenames: string[] = [];

		setPanelOpen(true);  // Open the panel if not already open
		setLoadingTitle('Generating Download Links...');  // Set loading title
		setLoading(true);  // Set loading to true when starting requests
		setProgress(0);     // Reset progress

		for (let i = 0; i < modResults.length; i++) {
			const mod = modResults[i];
			if (mod.error) continue; // Skip mods with errors
			const params = new URLSearchParams({
				slug: mod.slug,
				version: selectedVersion!,
				loader: selectedLoader!
			});

			const response = await fetch(`/api/mod/modrinth/download?${params}`);
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
				setLoading(false); // Stop loading if there is an error
				return;
			}
			const modResponse: { url: string, filename: string } = await response.json();
			modDownloadUrls.push(modResponse.url);
			modFilenames.push(modResponse.filename);

			setProgress(((i + 1) / modResults.length) * 100);
			// sleep for a random time above 200s to avoid rate limiting of 300 requests per minute
			await sleep(Math.floor(Math.random() * 200) + 200);
		}

		console.log(modDownloadUrls);
		console.log(modFilenames);

		setProgress(0); // Reset progress for zipping
		setLoadingTitle('Downloading Mods...'); // Set loading title

		const zip = new JSZip();
		let downloaded = 0;

		await Bluebird.map(
			modDownloadUrls,
			async (url, index) => {
				try {
					const blob = await downloadModFile(url);
					zip.file(modFilenames[index], blob);
				} catch (error) {
					console.error(`Error downloading ${url}:`, error);
					toast({
						title: 'Error downloading mods',
						description: 'Please try again later',
						variant: 'destructive'
					});
					setLoading(false); // Stop loading if there is an error
					return;
				} finally {
					downloaded++;
					setProgress((downloaded / modDownloadUrls.length) * 100);
				}
			},
			{ concurrency: 5 }
		);

		setProgress(0); // Reset progress for zipping
		setLoadingTitle('Zipping Mods...'); // Set loading title

		const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
			setProgress(metadata.percent); // Update progress during zipping
		}).catch((error) => {
			console.error('Error zipping mods:', error);
			toast({
				title: 'Error zipping mods',
				description: 'Please try again later',
				variant: 'destructive'
			});
			setLoading(false); // Stop loading if there is an error
			return;
		});
		if (!zipBlob) {
			toast({
				title: 'Error zipping mods',
				description: 'Please try again later',
				variant: 'destructive'
			});
			setLoading(false); // Stop loading if there is an error
			return;
		}

		setProgress(100); // Set progress to 100% after zipping
		toast({
			title: 'Download Complete',
			description: 'Your mods have been successfully downloaded'
		});

		const blobUrl = URL.createObjectURL(zipBlob!);
		setZipBlobUrl(blobUrl); // Store the blob URL

		setLoading(false); // Stop loading after zipping
	};

	return (
		<>
			<Card className="pr-10 pl-10 min-w-[30vw]">
				<CardHeader>
					<CardTitle className="text-xl">
						<Package className="h-6 w-6 inline-block mr-2" />
						Minecraft Modpack Maker
					</CardTitle>
					<CardDescription>Easily download a bunch of mods</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={constructModpack}>
						<div className="grid w-full items-center gap-4">
							<ModsInput update={setMods} />
							<ModLoaderChooser update={setSelectedLoader} />
							<VersionChooser update={setSelectedVersion} />
							<WebsiteSelector selectedSites={selectedSites} update={setSelectedSites} />
							<Button type="submit" variant="secondary" className="w-full">
								Construct Modpack
							</Button>
						</div>
					</form>
				</CardContent>
				<CardFooter className="">
					<p className="text-sm text-gray-500">Made by Spaceshark</p>
				</CardFooter>
			</Card>
			<AlertDialog open={panelOpen} onOpenChange={setPanelOpen}>
				<AlertDialogContent>
					<AlertDialogTitle>
						{loading ? loadingTitle : zipBlobUrl ?
							<div className="flex items-center">
								<Check className="h-6 w-6 inline mr-2" />
								<span>Download Complete</span>
							</div> :
							<div className="flex items-center">
								<List className="h-6 w-6 inline mr-2" />
								<span>Mod Results</span>
							</div>
						}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{loading ?
							<div className="mt-4">
								<Progress value={progress} />
								<p>{Math.round(progress)}% complete</p>
							</div> : null
						}
						{!loading && !zipBlobUrl && modResults.length > 0 ?
							<div>
								<ModResultsDisplay modResults={modResults} />
								<div className="mt-4 flex justify-end space-x-4">
									<Button
										variant="destructive"
										onClick={() => {
											setModResults([]); // Clear mod results
											setPanelOpen(false); // Close the panel
											console.log("Cancelled");
										}}
										className="flex items-center"
									>
										<Ban className="h-4 w-4 inline" />
										<span>Nevermind, Go Back</span>
									</Button>
									<Button
										variant="secondary"
										onClick={() => {
											console.log("Downloaded mods"); // placeholder for actual download logic
											handleDownload();
										}}
										className="flex items-center"
									>
										<Check className="h-4 w-4 inline" />
										<span>Confirm and Download Mods</span>
									</Button>
								</div>
							</div>
							: null}
						{zipBlobUrl ?
							<div className="mt-4 flex justify-end space-x-4">
								<Button
									variant="secondary"
									onClick={() => {
										setZipBlobUrl(null); // Clear the blob URL
										setPanelOpen(false); // Close the panel
									}}
									className="flex items-center"
								>
									<Ban className="h-4 w-4 inline" />
									<span>Close</span>
								</Button>
								<Button
									onClick={() => {
										saveAs(zipBlobUrl, "mods.zip"); // Trigger the download
									}}
									className="flex items-center"
								>
									<Download className="h-4 w-4 inline" />
									<span>Download Modpack</span>
								</Button>
							</div>
							: null}
					</AlertDialogDescription>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export default App;
