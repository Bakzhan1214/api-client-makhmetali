const API_BASE_URL = "https://jsonplaceholder.typicode.com";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const usersList = document.querySelector("#users-list");
const usersStatus = document.querySelector("#users-status");
const usersCount = document.querySelector("#users-count");
const detailsSection = document.querySelector("#details-section");
const detailsContent = document.querySelector("#details-content");
const closeDetailsButton = document.querySelector("#close-details");
const statisticsStatus = document.querySelector("#statistics-status");
const statisticsResults = document.querySelector("#statistics-results");
const usersTotal = document.querySelector("#users-total");
const postsTotal = document.querySelector("#posts-total");
const refreshStatisticsButton = document.querySelector("#refresh-statistics");

let currentSearchTerm = "";
let currentDetailsId = null;

// Все ответы проверяются до преобразования JSON, чтобы HTTP-ошибки не выглядели как успешные.
async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function showLoading(element, message) {
  element.className = "status-message";
  element.textContent = message;
}

function showError(element, message, onRetry) {
  element.className = "status-message status-error";
  element.replaceChildren();

  const errorText = document.createElement("span");
  errorText.textContent = message;

  const retryButton = document.createElement("button");
  retryButton.className = "button";
  retryButton.type = "button";
  retryButton.textContent = "Повторить";
  retryButton.addEventListener("click", onRetry, { once: true });

  element.append(errorText, retryButton);
}

function getErrorMessage(error, context) {
  if (error instanceof Error && error.message.startsWith("HTTP ")) {
    return `Не удалось получить ${context}: сервер вернул ошибку ${error.message}.`;
  }

  if (error instanceof TypeError) {
    return `Не удалось загрузить ${context}. Проверьте подключение к интернету и попробуйте снова.`;
  }

  return `Не удалось обработать данные для ${context}. Попробуйте выполнить запрос снова.`;
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderUsers(users) {
  usersList.replaceChildren();
  usersCount.textContent = `${users.length} ${getUserWord(users.length)}`;

  if (users.length === 0) {
    usersStatus.className = "status-message";
    usersStatus.textContent = "Ничего не найдено";
    return;
  }

  usersStatus.className = "status-message";
  usersStatus.textContent = "";

  users.forEach((user) => {
    const card = document.createElement("article");
    card.className = "user-card";

    const top = document.createElement("div");
    top.className = "user-card-top";

    const avatar = createTextElement("span", "avatar", getInitials(user.name));
    avatar.setAttribute("aria-hidden", "true");

    const identity = document.createElement("div");
    identity.append(
      createTextElement("h3", "", user.name),
      createTextElement("p", "user-handle", `@${user.username}`)
    );
    top.append(avatar, identity);

    const meta = document.createElement("div");
    meta.className = "user-meta";
    meta.append(
      createTextElement("p", "", `Email: ${user.email}`),
      createTextElement("p", "", `Город: ${user.address.city}`)
    );

    const detailsButton = document.createElement("button");
    detailsButton.className = "button button-secondary";
    detailsButton.type = "button";
    detailsButton.textContent = "Подробнее";
    detailsButton.addEventListener("click", () => showUserDetails(user.id));

    card.append(top, meta, detailsButton);
    usersList.append(card);
  });
}

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getUserWord(count) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "пользователей";
  }
  if (lastDigit === 1) {
    return "пользователь";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "пользователя";
  }
  return "пользователей";
}

async function loadUsers(searchTerm = "") {
  currentSearchTerm = searchTerm.trim();
  usersList.replaceChildren();
  usersCount.textContent = "";
  showLoading(usersStatus, "Загрузка данных...");

  const button = searchForm.querySelector("button");
  button.disabled = true;

  try {
    const query = new URLSearchParams();
    if (currentSearchTerm) {
      query.set("username", currentSearchTerm);
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_BASE_URL}/users?${queryString}`
      : `${API_BASE_URL}/users`;
    const users = await fetchJson(url);

    if (!Array.isArray(users)) {
      throw new Error("Сервер вернул данные в неожиданном формате.");
    }

    renderUsers(users);
  } catch (error) {
    showError(usersStatus, getErrorMessage(error, "список пользователей"), () => {
      loadUsers(currentSearchTerm);
    });
  } finally {
    button.disabled = false;
  }
}

async function searchUsers(event) {
  event.preventDefault();
  await loadUsers(searchInput.value);
}

function addDetailItem(container, label, value, options = {}) {
  const item = document.createElement("div");
  item.className = options.wide ? "detail-item detail-item-wide" : "detail-item";
  item.append(createTextElement("p", "detail-label", label));

  const valueElement = document.createElement("p");
  valueElement.className = "detail-value";

  if (options.href) {
    const link = document.createElement("a");
    link.href = options.href;
    link.textContent = value;
    link.target = "_blank";
    link.rel = "noreferrer";
    valueElement.append(link);
  } else {
    valueElement.textContent = value;
  }

  item.append(valueElement);
  container.append(item);
}

function renderUserDetails(user) {
  const content = document.createElement("div");
  content.className = "details-content";
  const address = `${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}`;

  addDetailItem(content, "Имя и username", `${user.name} (@${user.username})`, { wide: true });
  addDetailItem(content, "Email", user.email, { href: `mailto:${user.email}` });
  addDetailItem(content, "Телефон", user.phone, { href: `tel:${user.phone}` });
  addDetailItem(content, "Адрес", address, { wide: true });
  addDetailItem(content, "Компания", `${user.company.name} — ${user.company.catchPhrase}`, { wide: true });
  addDetailItem(content, "Веб-сайт", user.website, {
    href: `https://${user.website.replace(/^https?:\/\//, "")}`
  });

  detailsContent.replaceChildren(content);
}

async function showUserDetails(id) {
  currentDetailsId = id;
  detailsSection.hidden = false;
  detailsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  detailsContent.replaceChildren();
  showLoading(detailsContent, "Загрузка подробной информации...");

  try {
    const user = await fetchJson(`${API_BASE_URL}/users/${encodeURIComponent(id)}`);
    renderUserDetails(user);
  } catch (error) {
    detailsContent.replaceChildren();
    showError(detailsContent, getErrorMessage(error, "подробную информацию"), () => {
      showUserDetails(currentDetailsId);
    });
  }
}

function closeUserDetails() {
  detailsSection.hidden = true;
  detailsContent.replaceChildren();
  currentDetailsId = null;
}

async function loadStatistics() {
  showLoading(statisticsStatus, "Загрузка статистики...");
  statisticsResults.hidden = true;
  refreshStatisticsButton.disabled = true;

  try {
    // Promise.all запускает оба независимых GET-запроса параллельно.
    const [users, posts] = await Promise.all([
      fetchJson(`${API_BASE_URL}/users`),
      fetchJson(`${API_BASE_URL}/posts`)
    ]);

    if (!Array.isArray(users) || !Array.isArray(posts)) {
      throw new Error("Сервер вернул данные в неожиданном формате.");
    }

    usersTotal.textContent = users.length;
    postsTotal.textContent = posts.length;
    statisticsStatus.className = "status-message";
    statisticsStatus.textContent = "";
    statisticsResults.hidden = false;
  } catch (error) {
    showError(statisticsStatus, getErrorMessage(error, "статистику"), loadStatistics);
  } finally {
    refreshStatisticsButton.disabled = false;
  }
}

searchForm.addEventListener("submit", searchUsers);
closeDetailsButton.addEventListener("click", closeUserDetails);
refreshStatisticsButton.addEventListener("click", loadStatistics);

loadUsers();
loadStatistics();
