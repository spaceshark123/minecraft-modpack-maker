import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertTriangle, CircleAlert } from "lucide-react";

export interface Mod {
	error?: boolean;
	image?: string;
	title?: string;
	slug?: string;
	id?: string;
	similarity?: number;
	website?: string;
}

interface ModResultsDisplayProps {
	modResults: Mod[];
}

function ModResultsDisplay({ modResults }: ModResultsDisplayProps) {
	return (modResults.length > 0 ?
		<div className="mt-4 max-h-[70vh] overflow-y-auto max-w-[70vw] overflow-x-hidden">
			<Table>
				<TableBody>
					{modResults.map((mod, index) => (
						mod.error ? (
							<TableRow key={index} className="border-none max-w-[70vw]">
								<TableCell className="py-4 flex items-center text-red-600 space-x-2">
									<AlertTriangle className="h-5 w-5 text-red-500" />
									<span className="font-bold">
										Mod "{mod.title}" not found.
									</span>
								</TableCell>
								<TableCell className="py-2">
									<span></span> {/* Empty cell to keep the table structure */}
								</TableCell>
							</TableRow>
						) : (
							<TableRow key={index} className="border-none max-w-[70vw]">
								{/* Image + Name side by side */}
								<TableCell className="py-2">
									<div className="flex items-center space-x-4">
										<img
											src={mod.image}
											alt={mod.title}
											className="h-10 w-10 object-cover rounded"
										/>
										<div className="flex items-center space-x-2">
											{/* Mod title */}
											<span>{mod.title}</span>

											{/* Conditionally render yellow warning if similarity < 1 */}
											{(mod.similarity || 0) < 1 && (
												<Tooltip>
													<TooltipTrigger asChild>
														<CircleAlert className="h-4 w-4 text-yellow-500 cursor-pointer" />
													</TooltipTrigger>
													<TooltipContent>
														<span>Not exact match</span>
													</TooltipContent>
												</Tooltip>
											)}
										</div>
									</div>
								</TableCell>
								{/* Link to mod */}
								<TableCell className="py-2">
									<a
										href={mod.website === 'modrinth' ? `https://modrinth.com/mod/${mod.slug}` : `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 underline"
									>
										Mod Page
									</a>
								</TableCell>
							</TableRow>
						)
					))}
				</TableBody>
			</Table>
		</div> : null
	)
}

export default ModResultsDisplay;