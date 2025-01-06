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
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import ModLoaderChooser from './ModLoaderChooser';
import ModsInput from './ModsInput';
import VersionChooser from './VersionChooser';
import WebsiteSelector from './WebsiteSelector';
import { Progress } from '@/components/ui/progress';

function App() {
	const [mods, setMods] = useState<string[]>([]);
	const [selectedLoader, setSelectedLoader] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
	const [selectedSites, setSelectedSites] = useState<string[]>([]);

	const [modResults, setModResults] = useState<any[]>([]);  // Store fetched mod data
	const [loading, setLoading] = useState<boolean>(false);   // Track loading state
	const [progress, setProgress] = useState<number>(0);      // Progress state

	const [panelOpen, setPanelOpen] = useState(false);

	const { toast } = useToast();

	const constructModpack = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (mods.length === 0) {
			console.log('No mods provided');
			toast({
				title: 'No mods provided',
				description: 'Please provide at least one mod name',
				variant: 'destructive'
			});
			return;
		}
		if (!selectedLoader) {
			console.log('No loader selected');
			toast({
				title: 'No loader selected',
				description: 'Please select a mod loader',
				variant: 'destructive'
			});
			return;
		}
		if (!selectedVersion) {
			console.log('No version selected');
			toast({
				title: 'No version selected',
				description: 'Please select a Minecraft version',
				variant: 'destructive'
			});
			return;
		}

		setPanelOpen(true);  // Open the panel
		setLoading(true);  // Set loading to true when starting requests
		setModResults([]);  // Reset mod results
		setProgress(0);     // Reset progress

		let modsList = [];
		for (let i = 0; i < mods.length; i++) {
			const mod = mods[i];

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
				modsList.push({ name: mod, error: true });
			} else {
				const data = await response.json();
				modsList.push(data);
			}

			// Update progress after each mod fetch
			setProgress(((i + 1) / mods.length) * 100);
		}
		console.log(modsList);

		setModResults(modsList);  // Store the fetched mod results
		setLoading(false);        // Stop loading after requests finish
	};

	return (
		<>
			<Card className="pr-10 pl-10 min-w-[30vw]">
				<CardHeader>
					<CardTitle className="text-xl">Minecraft Modpack Maker</CardTitle>
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
						{loading ? 'Fetching Mods...' : 'Mod Results'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{loading ?
							<div className="mt-4">
								<Progress value={progress} />
								<p>{Math.round(progress)}% complete</p>
							</div> : null
						}
						{modResults.length > 0 ?
							<div className="mt-4">
								<table className="min-w-full table-auto">
									<thead>
										<tr>
											<th className="px-4 py-2">Mod Image</th>
											<th className="px-4 py-2">Mod Name</th>
											<th className="px-4 py-2">Mod Link</th>
										</tr>
									</thead>
									<tbody>
										{modResults.map((mod, index) => (
											mod.error ?
												<tr key={index}>
													<td className="border px-4 py-2" colSpan={3}>
														{mod.name} not found
													</td>
												</tr>
												:
											<tr key={index}>
												<td className="border px-4 py-2">
													<img src={mod.image} alt={mod.title} className="h-10 w-10 object-cover" />
												</td>
												<td className="border px-4 py-2">{mod.title}</td>
												<td className="border px-4 py-2">
													<a href={mod.link} target="_blank" rel="noopener noreferrer" className="text-blue-500">
														Mod Page
													</a>
												</td>
											</tr>
										))}
									</tbody>
								</table>
								<AlertDialogCancel asChild>
									<Button className="mt-4 mr-4" variant="destructive" onClick={() => {
										setModResults([]);  // Clear mod results
										setPanelOpen(false);  // Close the panel
										console.log('Cancelled');
									}}>
										Nevermind, Go Back
									</Button>
								</AlertDialogCancel>
								<AlertDialogAction asChild>
									<Button className="mt-4" variant="secondary" onClick={() => {
										console.log('Downloaded mods'); // placeholder
									}}>
										Confirm and Download Mods
									</Button>
								</AlertDialogAction>
							</div>
							: null}
					</AlertDialogDescription>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export default App;
