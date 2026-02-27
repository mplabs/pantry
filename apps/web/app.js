const STORAGE_KEY = "pantry.inventory.v1";
const EXPIRING_SOON_DAYS = 7;

const form = document.getElementById("item-form");
const tableBody = document.getElementById("inventory-table-body");
const stats = document.getElementById("stats");
const statusFilter = document.getElementById("status-filter");
const emptyRowTemplate = document.getElementById("empty-row-template");

let items = loadItems();
let activeFilter = "all";

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const purchaseDate = formData.get("purchaseDate") || todayString();
  const shelfLifeDays = parseInt(formData.get("shelfLifeDays"), 10);
  let useByDate = formData.get("useByDate") || "";
  if (!useByDate && Number.isInteger(shelfLifeDays)) {
    useByDate = datePlusDays(purchaseDate, shelfLifeDays);
  }

  const nextItem = {
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    quantity: Number(formData.get("quantity")),
    unit: String(formData.get("unit")).trim(),
    category: String(formData.get("category")).trim(),
    location: String(formData.get("location")).trim(),
    purchaseDate,
    useByDate,
    shelfLifeDays: Number.isInteger(shelfLifeDays) ? shelfLifeDays : null,
    createdAt: new Date().toISOString()
  };

  items.push(nextItem);
  saveItems(items);
  form.reset();
  render();
});

statusFilter.addEventListener("change", () => {
  activeFilter = statusFilter.value;
  render();
});

tableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const { action, id } = target.dataset;
  if (!action || !id) return;

  if (action === "delete") {
    items = items.filter((item) => item.id !== id);
    saveItems(items);
    render();
  }
});

function render() {
  renderStats(items);
  renderTable(items, activeFilter);
}

function renderStats(list) {
  const model = list.map((item) => ({ ...item, status: getStatus(item) }));
  const total = model.length;
  const fresh = model.filter((item) => item.status.key === "fresh").length;
  const expiring = model.filter((item) => item.status.key === "expiring").length;
  const expired = model.filter((item) => item.status.key === "expired").length;

  stats.innerHTML = "";
  stats.append(
    makeStat("Total Items", String(total)),
    makeStat("Fresh", String(fresh)),
    makeStat("Expiring Soon", String(expiring)),
    makeStat("Expired", String(expired))
  );
}

function renderTable(list, filter) {
  const model = list
    .map((item) => ({ ...item, status: getStatus(item) }))
    .sort((a, b) => sortByUseByDate(a, b));

  const filtered = filter === "all" ? model : model.filter((item) => item.status.key === filter);
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.append(emptyRowTemplate.content.cloneNode(true));
    return;
  }

  filtered.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}${item.location ? `<br><small>${escapeHtml(item.location)}</small>` : ""}</td>
      <td>${formatQuantity(item.quantity, item.unit)}</td>
      <td>${escapeHtml(item.category || "Uncategorized")}</td>
      <td>${item.useByDate ? formatDate(item.useByDate) : "N/A"}</td>
      <td><span class="badge ${item.status.key}">${item.status.label}</span></td>
      <td>
        <button class="small-btn" data-action="delete" data-id="${item.id}">Delete</button>
      </td>
    `;
    tableBody.append(row);
  });
}

function getStatus(item) {
  if (!item.useByDate) return { key: "fresh", label: "No Use-by" };

  const today = stripTime(new Date());
  const useBy = stripTime(new Date(item.useByDate));
  const deltaDays = Math.floor((useBy - today) / 86400000);

  if (deltaDays < 0) return { key: "expired", label: "Expired" };
  if (deltaDays <= EXPIRING_SOON_DAYS) return { key: "expiring", label: `Use Soon (${deltaDays}d)` };
  return { key: "fresh", label: "Fresh" };
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(nextItems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}

function makeStat(name, value) {
  const block = document.createElement("article");
  block.className = "stat";
  block.innerHTML = `<p class="stat-name">${name}</p><p class="stat-value">${value}</p>`;
  return block;
}

function sortByUseByDate(a, b) {
  if (!a.useByDate && !b.useByDate) return a.name.localeCompare(b.name);
  if (!a.useByDate) return 1;
  if (!b.useByDate) return -1;
  return a.useByDate.localeCompare(b.useByDate);
}

function datePlusDays(dateString, days) {
  const base = new Date(dateString);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString();
}

function formatQuantity(quantity, unit) {
  const base = Number.isInteger(quantity) ? String(quantity) : String(quantity.toFixed(2));
  return unit ? `${base} ${escapeHtml(unit)}` : base;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
