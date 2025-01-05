import { useState, useEffect } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import ModLoaderChooser from './ModLoaderChooser'
import ModsInput from './ModsInput'
import VersionChooser from './VersionChooser'
import WebsiteSelector from './WebsiteSelector'

function App() {
	const [mods, setMods] = useState<string[]>([]);
	const [selectedLoader, setSelectedLoader] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
	const [selectedSites, setSelectedSites] = useState<string[]>([]);

	const constructModpack = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// get from 3000. it should return text for now
		const res = await fetch('http://localhost:3000/api');
		const data = await res.text();
		console.log(data);
	}

	return (
		<>
			<Card className='pr-10 pl-10 min-w-[30vw]'>
				<CardHeader>
					<CardTitle className='text-xl'>Minecraft Modpack Maker</CardTitle>
					<CardDescription>Easily download a bunch of mods</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={constructModpack}>
						<div className="grid w-full items-center gap-4">
							<ModsInput update={setMods} />
							<ModLoaderChooser update={setSelectedLoader} />
							<VersionChooser update={setSelectedVersion} />
							<WebsiteSelector selectedSites={selectedSites} update={setSelectedSites} />
							<Button type='submit' variant='secondary' className='w-full'>Construct Modpack</Button>
						</div>
					</form>
				</CardContent>
				<CardFooter className=''>
					<p className='text-sm text-gray-500'>
						Made by Spaceshark
					</p>
				</CardFooter>
			</Card>
		</>
	)
}

export default App;