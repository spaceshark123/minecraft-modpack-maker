import { Label } from "@/components/ui/label"
import EditableList from './EditableList'

interface ModsInputProps {
	update: (value: string[]) => void;
	value: string; // prop to set the initial value of the textarea
	setValue: (value: string) => void; // setter for the value, if needed
}

function ModsInput({ update, value, setValue }: ModsInputProps) {
	return (
		<div className="flex flex-col space-y-1.5">
			<Label htmlFor="mods-input">Mods</Label>
			<EditableList id="mods-input" placeholder='Paste your mods here...' update={update} value={value} setValue={setValue} />
		</div>
	)
}

export default ModsInput;