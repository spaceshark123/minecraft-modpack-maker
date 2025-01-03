import requests
from bs4 import BeautifulSoup
import os
import json

# Modrinth mods page URL
url = "https://modrinth.com/mods"

# Send a request to fetch the page content
response = requests.get(url)
html_content = response.content

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, "html.parser")

# Find all spans containing Minecraft versions
versions = []
for span in soup.find_all("span"):
    text = span.get_text()
    if text and all(part.isdigit() or part == "." for part in text) and text.count(".") > 0: # Check if the text is a version string
        versions.append(text)

# Remove duplicates
unique_versions = list(set(versions))

# Define a function to split and convert version strings into lists of integers
def version_key(version):
    return [int(part) for part in version.split(".") if part.isdigit()]

# Sort versions based on the version order (converted to integer parts)
sorted_versions = sorted(unique_versions, key=version_key, reverse=True)

# Output the full list of Minecraft versions to json file
output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "versions")
os.makedirs(output_dir, exist_ok=True)

# Write the sorted versions to a JSON file pretty-printed
output_file = os.path.join(output_dir, "minecraft-versions.json")
with open(output_file, "w") as file:
    json.dump(sorted_versions, file, indent=4)
    
print(f"Successfully scraped {len(sorted_versions)} Minecraft versions to {output_file}")