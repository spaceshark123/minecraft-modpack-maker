import { Label } from "@/components/ui/label"
import EditableList from './EditableList'

function ModsInput() {
	return (
		<div className="flex flex-col space-y-1.5">
			<Label htmlFor="mods-input">Mods</Label>
			<EditableList id="mods-input" placeholder='Paste your mods here...' />
		</div>
	)
}

export default ModsInput;