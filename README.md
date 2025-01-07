# [Minecraft Modpack Maker](https://minecraft-modpack-maker.onrender.com)

Minecraft Modpack Maker is a web application that simplifies the process of creating custom Minecraft modpacks. Users can input a list of mods, specify the Minecraft version, choose a mod installer, and select mod forums to search on. The application then collects all the mods into a single zip file for easy download using realtime web scraping.

Currently hosted/deployed using render.com

## Features

- **Custom Modpacks**: Create modpacks with real mod files instead of using a modpack launcher.
- **Web Scraping**: Automatically gather mods from specified forums.
- **Easy Download**: Download all selected mods in a single zip file.
- **User-Friendly Interface**: Simple and intuitive UI for selecting mods and settings.

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