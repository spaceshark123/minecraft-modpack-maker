import { Label } from "@/components/ui/label"
import EditableList from './EditableList'

interface ModsInputProps {
	update: (value: string[]) => void;
}

function ModsInput({ update }: ModsInputProps) {
	return (
		<div className="flex flex-col space-y-1.5">
			<Label htmlFor="mods-input">Mods</Label>
			<EditableList id="mods-input" placeholder='Paste your mods here...' update={update} />
		</div>
	)
}

export default ModsInput;