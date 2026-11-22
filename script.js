const form = document.getElementById("username-form");
const usernameInput = document.getElementById("username");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status");
const results = document.getElementById("results");
const resultsSummary = document.getElementById("results-summary");
const profileLink = document.getElementById("profile-link");
const repositoryList = document.getElementById("repository-list");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");
const pagination = document.getElementById("pagination");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const pageLabel = document.getElementById("page-label");

const PAGE_SIZE = 12;
const REQUEST_TIMEOUT = 15000;

let currentUsername = "";
let currentPage = 1;
let hasNextPage = false;
let isLoading = false;

function setStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

function showEmptyState(title, message) {
  emptyTitle.textContent = title;
  emptyMessage.textContent = message;
  emptyState.hidden = false;
}

function setLoading(loading) {
  isLoading = loading;
  searchButton.disabled = loading;
  searchButton.textContent = loading ? "Loading..." : "Find repositories";
  usernameInput.readOnly = loading;
  results.setAttribute("aria-busy", String(loading));
  previousButton.disabled = loading || currentPage === 1;
  nextButton.disabled = loading || !hasNextPage;
}

function clearResults() {
  repositoryList.replaceChildren();
  profileLink.hidden = true;
  pagination.hidden = true;
  resultsSummary.textContent = "Only public repositories are shown.";
  currentUsername = "";
  currentPage = 1;
  hasNextPage = false;
  pageLabel.textContent = "Page 1";
}

function getApiError(response, username) {
  if (response.status === 404) {
    return `No GitHub account named "${username}" was found. Check the username and try again.`;
  }

  if (response.status === 429 ||
      (response.status === 403 && response.headers.get("X-RateLimit-Remaining") === "0")) {
    const resetTime = Number(response.headers.get("X-RateLimit-Reset")) * 1000;
    if (Number.isFinite(resetTime) && resetTime > Date.now()) {
      const time = new Date(resetTime).toLocaleTimeString();
      return `GitHub's API rate limit was reached. Try again after ${time} (your local time).`;
    }
    return "GitHub's API rate limit was reached. Please wait a while and try again.";
  }

  if (response.status === 403) {
    return "GitHub refused this request (HTTP 403). It may be a restriction or rate limit. Please wait and try again.";
  }

  if (response.status >= 500) {
    return `GitHub is having trouble (HTTP ${response.status}). Please try again later.`;
  }

  return `GitHub returned an API error (HTTP ${response.status}). Please try again.`;
}

function renderRepositories(repositories) {
  const fragment = document.createDocumentFragment();

  for (const repository of repositories) {
    if (!repository ||
        typeof repository.name !== "string" ||
        typeof repository.html_url !== "string" ||
        !repository.html_url.startsWith("https://github.com/")) {
      throw new Error("GitHub returned unexpected repository data. Please try again.");
    }

    const item = document.createElement("li");
    item.className = "repository-item";

    const details = document.createElement("div");
    details.className = "repository-details";

    const title = document.createElement("h3");
    title.className = "repository-title";

    const link = document.createElement("a");
    link.className = "repository-link";
    link.textContent = repository.name;
    link.href = repository.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${repository.name} on GitHub (opens in a new tab)`);
    title.append(link);

    const description = document.createElement("p");
    description.className = "repository-description";
    description.textContent = repository.description || "No description provided.";
    details.append(title, description);

    const language = document.createElement("p");
    language.className = "repository-language";

    const languageLabel = document.createElement("span");
    languageLabel.textContent = "Primary language:";

    const languageValue = document.createElement("strong");
    languageValue.textContent = repository.language || "Not detected";
    language.append(languageLabel, languageValue);

    item.append(details, language);
    fragment.append(item);
  }

  repositoryList.replaceChildren(fragment);
}

async function loadRepositories(username, page) {
  if (isLoading) {
    return;
  }

  setStatus(`Loading page ${page} of public repositories for @${username}...`, "loading");
  setLoading(true);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=${PAGE_SIZE}&page=${page}`;
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(getApiError(response, username));
    }

    const repositories = await response.json();
    if (!Array.isArray(repositories)) {
      throw new Error("GitHub returned an unexpected response. Please try again.");
    }

    renderRepositories(repositories);
    currentUsername = username;
    currentPage = page;
    hasNextPage = (response.headers.get("Link") || "").includes('rel="next"');
    profileLink.href = `https://github.com/${encodeURIComponent(username)}`;
    profileLink.textContent = `View @${username} on GitHub`;
    profileLink.setAttribute("aria-label", `View @${username} on GitHub (opens in a new tab)`);
    profileLink.hidden = false;
    pageLabel.textContent = `Page ${page}`;
    pagination.hidden = page === 1 && !hasNextPage;

    if (repositories.length === 0) {
      resultsSummary.textContent = `No repositories to display on page ${page} for @${username}.`;
      showEmptyState(
        page === 1 ? "No public repositories yet" : "This page is empty",
        page === 1
          ? "This account has no public repositories. Private repositories are not shown."
          : "Repositories may have changed. Use Previous to return to an earlier page."
      );
      setStatus(`No public repositories found on page ${page} for @${username}.`, "success");
    } else {
      const first = (page - 1) * PAGE_SIZE + 1;
      const last = first + repositories.length - 1;
      const noun = repositories.length === 1 ? "repository" : "repositories";
      resultsSummary.textContent = `Showing repositories ${first}-${last}. Most recently updated first.`;
      emptyState.hidden = true;
      setStatus(`Loaded ${repositories.length} public ${noun} on page ${page} for @${username}.`, "success");
    }
  } catch (error) {
    let message = "Something went wrong. Please try again.";
    if (error instanceof Error && error.name === "AbortError") {
      message = "The request took too long. Check your connection and try again.";
    } else if (error instanceof TypeError) {
      message = "Could not connect to GitHub. Check your internet connection and try again.";
    } else if (error instanceof SyntaxError) {
      message = "GitHub returned unreadable data. Please try again.";
    } else if (error instanceof Error) {
      message = error.message;
    }
    setStatus(message, "error");
    if (repositoryList.childElementCount === 0) {
      showEmptyState("Could not load repositories", "Check the message above, then try your search again.");
    }
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isLoading) {
    return;
  }

  const username = usernameInput.value.trim();
  usernameInput.value = username;
  clearResults();

  if (username === "") {
    usernameInput.setAttribute("aria-invalid", "true");
    setStatus("Please enter a GitHub username. Spaces alone do not count.", "error");
    showEmptyState("A username is needed", "Enter a handle such as octocat in the search field above.");
    usernameInput.focus();
    return;
  }

  usernameInput.removeAttribute("aria-invalid");
  showEmptyState("Loading repositories", "Fetching public data from GitHub.");
  loadRepositories(username, 1);
});

previousButton.addEventListener("click", () => {
  loadRepositories(currentUsername, currentPage - 1);
});

nextButton.addEventListener("click", () => {
  loadRepositories(currentUsername, currentPage + 1);
});
