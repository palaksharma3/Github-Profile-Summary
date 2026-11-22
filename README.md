# GitHub Profile Dashboard

A simple web application that lets you enter a GitHub username
and explore that account's public repositories.

This is a learning project focused on JavaScript, HTTP APIs,
JSON, and asynchronous requests.

## Features

- Search for a GitHub username.
- View repository names, descriptions, and primary languages.
- Open repositories and the user's profile on GitHub.
- Browse results using Next and Previous buttons.
- See loading messages, empty results, and useful error messages.

## Technologies

- HTML for page structure
- CSS for styling and responsive layouts
- Vanilla JavaScript for interactivity
- GitHub REST API for repository data

## Run online


(https://palaksharma3.github.io/Github-Profile-Summary/)

1. Open the live dashboard in your browser.
2. Enter a GitHub username, such as octocat.
3. Select Find repositories.
4. Use Next and Previous to browse repository pages.

An internet connection is required.
No installation or GitHub sign-in is needed.

## Run locally

1. Download this repository using Code > Download ZIP.
2. Extract the ZIP and open the project folder.
3. Open index.html in a modern browser.
4. Enter a GitHub username, such as octocat.
5. Select Find repositories.

An internet connection is required.
No installation, backend server, or access token is needed.

## Project files

- `index.html`: The search form, status messages, and results area.
- `style.css`: Layout, colors, and mobile styling.
- `script.js`: API requests, error handling, and repository rendering.
- `README.md`: Project information and setup instructions.

## How it works

JavaScript reads the submitted username and requests its public
repositories from GitHub's REST API.

The JSON response is converted into JavaScript data. The app then
creates HTML elements to display each repository.

Results are sorted by most recent update, with up to 12 repositories
per page. GitHub's response headers indicate whether another page exists.

## Limitations

- Only public repositories owned by the account are displayed.
- Each repository shows one primary language, not a full breakdown.
- GitHub limits unauthenticated API requests.
- Results require an internet connection and are not cached.

## Planned improvements

- Cache recent searches to reduce repeated API requests.
- Add repository filtering.
