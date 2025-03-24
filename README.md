# [Minecraft Modpack Maker](https://minecraft-modpack-maker.onrender.com)

Minecraft Modpack Maker is a web application that simplifies the process of creating custom Minecraft modpacks. Users can input a list of mods, specify the Minecraft version, choose a mod installer, and select mod forums to search on. The application then collects all the mods into a single zip file for easy download using realtime web scraping.

Currently hosted/deployed using the free tier of render.com (meaning the site has a startup time of ~30 seconds for periods of inactivity)

## Features

- **Custom Modpacks**: Create modpacks with real mod files instead of using a modpack launcher, allowing for complete control
- **Automatic Scraping**: Automatically gather up-to-date mods from specified forums.
- **Full Version Support**: Supports all major Minecraft versions and is constantly updated.
- **Popular Modloaders**: Supports most widely used modloaders: forge, fabric, neoforge, quilt
- **Robust Mod Search**: Small mistakes and typos with the mod name on the list will not affect the quality of results.
- **Easy Download**: Download all selected mods in a single zip file.
- **User-Friendly Interface**: Simple and intuitive UI for selecting mods and settings.

## How to Use

1. Enter list of mods into text box (copy/paste or manually). mods can be separated using commas or different lines
2. Select the desired Minecraft mod loader from the dropdown
3. Select the desired Minecraft game version from the dropdown
4. Select the websites/forums that you want to source mods from. Choose all for the best results.
5. Press construct! The mods will be searched for and a list of found mods will appear to allow you to confirm that the correct mods have been found for your list. If you are satisfied with the mods, press confirm to start the download process
6. After the mods have been downloaded, press the download button to recieve your modpack as a .zip file
7. extract the contents of the .zip file to receive the mods folder, which can be directly put into the .minecraft folder

## Tech Stack

### Frontend

- **React**
- **Tailwind CSS**
- **Typescript**
- **Vite**
- **Shadcn UI**

### Backend

- **Node.js**
- **Express.js**
- **Typescript**

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/spaceshark123/minecraft-modpack-maker.git
    cd minecraft-modpack-maker
    ```

2. Install dependencies for base project:

	```sh
    npm install
    ```

3. Install dependencies for the backend:

    ```sh
    cd backend
    npm install
    ```

4. Install dependencies for the frontend:

    ```sh
    cd ../frontend
    npm install
    ```

### Building the Application

1. Navigate to the root directory for the project

2. Build the entire application:

    ```sh
    npm run build
    ```

### Running the Application

1. Ensure both the backend and frontend have been built

2. Run the entire application (which serves the website)

	```sh
	npm run start
	```

3. Open your browser and navigate to the URL shown, usually `http://localhost:3000`

## Additional Commands

- Build frontend website only

	```sh
	npm run build:frontend
	```

- Build backend server only

	```sh
	npm run build:backend
	```

- Preview frontend website (doesn't have to be built)

	```sh
	npm run dev:frontend
	```

- View frontend website (must be built)

	```sh
	npm run start:frontend
	```

- Start backend server only

	```sh
	npm run start:backend
	```

## Troubleshooting

If you encounter any issues, please check the following:

- Ensure all dependencies are installed correctly.
- Verify that the backend and frontend servers are running.
- Check the browser console and server logs for any error messages.

For further assistance, please open an issue on the GitHub repository.