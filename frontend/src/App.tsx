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
import { sleep, uniqueMods, downloadModFile, zipMods, handleResponse } from './modpackUtils';

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

	const validateInputs = (
		workingMods: string[] = mods
	) => {
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
		if (selectedSites.length === 0) {
			console.log('No websites selected');
			toast({
				title: 'No websites selected',
				description: 'Please select at least one website to search for mods',
				variant: 'destructive'
			});
			valid = false;
		}
		return valid;
	}

	const constructModpack = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		let workingMods = mods;

		// remove duplicate mods
		workingMods = [...new Set(workingMods)];
		console.log("removed duplicates", workingMods);

		if (!validateInputs(workingMods)) return;

		setPanelOpen(true);  // Open the panel
		setLoadingTitle('Fetching Mods...');  // Set loading title
		setLoading(true);  // Set loading to true when starting requests
		setModResults([]);  // Reset mod results
		setProgress(0);     // Reset progress

		let modsList = [];
		for (let i = 0; i < workingMods.length; i++) {
			const mod = workingMods[i];

			// For each mod, make a request to the backend to get the mod data
			let modData: Mod | null = null;
			let modStatus: number | null = null;
			for (let site of selectedSites) {
				const url = `/api/mod/${site}?name=${mod}&version=${selectedVersion}&loader=${selectedLoader}`;
				const response = await fetch(url);
				const data: Mod = await response.json();
				data.website = site;
				if (modData === null) { // First mod data
					modData = data;
					modStatus = response.status;
				} else if (!data.error && data.similarity! > modData.similarity!) { // Higher similarity
					modData = data;
					modStatus = response.status;
				} else if (!data.error && data.similarity === modData.similarity && data.website === 'modrinth') { // Prefer Modrinth
					modData = data;
					modStatus = response.status;
				} else if (!data.error && modData.error) { // Prefer non-error
					modData = data;
					modStatus = response.status;
				}
			}
			if (modStatus === 429) {
				toast({
					title: 'Too many requests',
					description: 'Please try again later',
					variant: 'destructive'
				});
				setModResults([]);  // Clear mod results
				setPanelOpen(false);  // Close the panel
				setLoading(false);    // Stop loading
				return;
			} else if (modStatus === 404) {
				toast({
					description: `${mod} not found`,
					variant: 'destructive'
				});
				modsList.push({ title: mod, error: true });
			} else {
				modsList.push(modData as Mod);
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
		let modsList: { url: string, filename: string }[] = [];

		setPanelOpen(true);  // Open the panel if not already open
		setLoadingTitle('Generating Download Links...');  // Set loading title
		setLoading(true);  // Set loading to true when starting requests
		setProgress(0);     // Reset progress

		for (let i = 0; i < modResults.length; i++) {
			const mod = modResults[i];
			if (mod.error) continue; // Skip mods with errors
			const params = new URLSearchParams({
				slug: mod.slug,
				id: mod.id,
				version: selectedVersion!,
				loader: selectedLoader!
			});

			const response = await fetch(`/api/mod/${mod.website}/download?${params}`);
			if (!handleResponse(response, toast)) {
				setLoading(false); // Stop loading if there is an error
				return;
			}

			const modResponse: { url: string, filename: string } = await response.json();
			modsList.push(modResponse);

			setProgress(((i + 1) / modResults.length) * 100);
			// sleep for a random time above 200s to avoid rate limiting of 300 requests per minute
			await sleep(Math.floor(Math.random() * 200) + 200);
		}

		console.log(modsList);

		setProgress(0); // Reset progress for zipping
		setLoadingTitle('Downloading Mods...'); // Set loading title

		const zip = new JSZip();
		let downloaded = 0;

		await Bluebird.map(
			modsList,
			async (mod, _) => {
				try {
					const blob = await downloadModFile(mod.url);
					zip.file(mod.filename, blob);
				} catch (error) {
					console.error(`Error downloading ${mod.url}:`, error);
					toast({
						title: 'Error downloading mods',
						description: 'Please try again later',
						variant: 'destructive'
					});
					setLoading(false); // Stop loading if there is an error
					return;
				} finally {
					downloaded++;
					setProgress((downloaded / modsList.length) * 100);
				}
			},
			{ concurrency: 5 }
		);

		setProgress(0); // Reset progress for zipping
		setLoadingTitle('Zipping Mods...'); // Set loading title

		const zipBlob = await zipMods(zip, setProgress);
		if (!zipBlob) {
			toast({
				title: 'Error zipping mods',
				description: 'Please try again later',
				variant: 'destructive'
			});
			setLoading(false); // Stop loading if there is an error
			return;
		}

		toast({
			title: 'Download Complete',
			description: 'Your mods have been successfully downloaded'
		});

		const blobUrl = URL.createObjectURL(zipBlob);
		setZipBlobUrl(blobUrl); // Store the blob URL

		setLoading(false); // Stop loading after zipping
	};

	return (
		<>
			<Card className="pr-[10px] md:pr-10 pl-[10px] md:pl-10 min-w-[30vw] max-w-[90vw] md:w-[500px] w-[90vw] md:h-fit h-[90vh] overflow-x-hidden overflow-y-auto">
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
				<AlertDialogContent className="overflow-hidden max-w-[90vw] md:max-w-[500px]">
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
								<div className="mt-4 flex justify-end space-x-4 max-w-[90vw] md:max-w-[500px]">
									<Button
										variant="destructive"
										onClick={() => {
											setModResults([]); // Clear mod results
											setPanelOpen(false); // Close the panel
											console.log("Cancelled");
										}}
										className="flex items-center max-w-[45%] md:max-w-fit text-nowrap h-fit"
									>
										<Ban className="h-4 w-4 inline" />
										<span className="hidden md:inline" >Nevermind, Go Back</span>
									</Button>
									<Button
										variant="secondary"
										onClick={() => {
											console.log("Downloaded mods"); // placeholder for actual download logic
											handleDownload();
										}}
										className="flex items-center max-w-[45%] md:max-w-fit text-nowrap h-fit"
									>
										<Check className="h-4 w-4 inline" />
										<span className="hidden md:inline" >Confirm and Download Mods</span>
									</Button>
								</div>
							</div>
							: null}
						{zipBlobUrl ?
							<div className="mt-4 flex justify-end space-x-4 max-w-[90vw] md:max-w-[500px]">
								<Button
									variant="secondary"
									onClick={() => {
										setPanelOpen(false); // Close the panel
										setZipBlobUrl(null); // Clear the blob URL
									}}
									className="flex items-center max-w-[45%] md:max-w-fit text-nowrap h-fit"
								>
									<Ban className="h-4 w-4 inline" />
									<span className="hidden md:inline" >Close</span>
								</Button>
								<Button
									onClick={() => {
										saveAs(zipBlobUrl, "mods.zip"); // Trigger the download
									}}
									className="flex items-center max-w-[45%] md:max-w-fit text-nowrap h-fit"
								>
									<Download className="h-4 w-4 inline" />
									<span className="hidden md:inline" >Download Modpack</span>
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
