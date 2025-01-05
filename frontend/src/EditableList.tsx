import { Textarea } from "@/components/ui/textarea"

interface EditableListProps {
	placeholder?: string;
	id?: string;
	update: (value: string[]) => void;
}

// Define the component
function EditableList ({ placeholder, id, update}: EditableListProps) {
	// Function to handle pasted input
	const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
		event.preventDefault();

		// Get pasted text from the event
		const pastedText = event.clipboardData.getData('text');

		// Split pasted text by newlines and commas and remove empty strings. remove whitespace/tabs. remember about carriage return
		const newItems = pastedText.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

		// append new items to the list. if there is no newline between the current content and the pasted content, add a newline
		event.currentTarget.value += (event.currentTarget.value && !event.currentTarget.value.endsWith('\n') ? '\n' : '') + newItems.join('\n');

		// trigger the change event
		const changeEvent = new Event('input', { bubbles: true });
		event.currentTarget.dispatchEvent(changeEvent);
	};

	return (
		<div className="space-y-4">
			{/* Input area for pasting text */}
			<Textarea id={id}
				//className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				rows={5}
				placeholder={placeholder || "Paste your list here..."}
				className="max-h-64 h-[50vh] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100"
				onPaste={handlePaste}
				onInput={(event) => {
					// Split the input by newlines and remove empty strings
					const items = event.currentTarget.value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

					// Update the parent component with the new list
					update(items);
					console.log(items);
				}}
			/>
		</div>
	);
};

export default EditableList;
