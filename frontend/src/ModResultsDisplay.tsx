import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

interface Mod {
	error?: boolean;
	name?: string;
	image?: string;
	title?: string;
	link?: string;
}

interface ModResultsDisplayProps {
	modResults: Mod[];
}

function ModResultsDisplay({ modResults }: ModResultsDisplayProps) {
	return ( modResults.length > 0 ?
		<div className="mt-4">
			<Table>
				<TableBody>
					{modResults.map((mod, index) => (
						mod.error ? (
							<TableRow key={index} className="border-none">
								<TableCell className="py-4 flex items-center text-red-600 space-x-2">
									<AlertTriangle className="h-5 w-5 text-red-500" />
									<span className="font-bold">
										Mod "{mod.name}" not found.
									</span>
								</TableCell>
								<TableCell className="py-2">
									<span></span> {/* Empty cell to keep the table structure */}
								</TableCell>
							</TableRow>
						) : (
							<TableRow key={index} className="border-none">
								{/* Image + Name side by side */}
								<TableCell className="py-2">
									<div className="flex items-center space-x-4">
										<img
											src={mod.image}
											alt={mod.title}
											className="h-10 w-10 object-cover rounded"
										/>
										<span>{mod.title}</span>
									</div>
								</TableCell>
								{/* Link to mod */}
								<TableCell className="py-2">
									<a
										href={mod.link}
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