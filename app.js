/* -- 1. DOM Elements -- */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const currentDate = document.getElementById("current-date");
const themeToggle = document.getElementById("theme-toggle");

const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const currentBalance = document.getElementById("current-balance");
const balanceCard = document.getElementById("balance-card");
const balanceDescription = document.getElementById("balance-description");

const addTransactionButton = document.getElementById("add-transaction-button");
const exportCsvButton = document.getElementById("export-csv-button");
const transactionSearch = document.getElementById("transaction-search");
const categoryFilter = document.getElementById("category-filter");
const transactionList = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");

const spendingChart = document.getElementById("spending-chart");
const chartLegend = document.getElementById("chart-legend");
const chartEmptyState = document.getElementById("chart-empty-state");

const sidebarBudgetAmount = document.getElementById("sidebar-budget-amount");
const sidebarBudgetProgress = document.getElementById("sidebar-budget-progress");
const sidebarBudgetFill = document.getElementById("sidebar-budget-fill");
const sidebarBudgetNote = document.getElementById("sidebar-budget-note");

const budgetForm = document.getElementById("budget-form");
const monthlyBudgetInput = document.getElementById("monthly-budget");
const budgetTotal = document.getElementById("budget-total");
const budgetSpent = document.getElementById("budget-spent");
const budgetRemaining = document.getElementById("budget-remaining");
const budgetProgress = document.getElementById("budget-progress");
const budgetProgressFill = document.getElementById("budget-progress-fill");
const budgetStatus = document.getElementById("budget-status");
const budgetWarning = document.getElementById("budget-warning");

const transactionDialog = document.getElementById("transaction-dialog");
const transactionForm = document.getElementById("transaction-form");
const transactionDialogTitle = document.getElementById("transaction-dialog-title");
const closeTransactionDialog = document.getElementById("close-transaction-dialog");
const cancelTransaction = document.getElementById("cancel-transaction");
const saveTransactionButton = document.getElementById("save-transaction-button");
const transactionType = document.getElementById("transaction-type");
const transactionDescription = document.getElementById("transaction-description");
const transactionAmount = document.getElementById("transaction-amount");
const transactionCategory = document.getElementById("transaction-category");
const transactionDate = document.getElementById("transaction-date");
const toastContainer = document.getElementById("toast-container");

/* -- 2. Application State -- */
let transactions = [];
let monthlyBudget = 0;
let editingTransactionId = null;
let spendingChartInstance = null;
let currentTheme = "dark";
let activeCategoryFilter = "all";
let transactionSearchQuery = "";
let isSidebarOpen = false;

const STORAGE_KEYS = {
    transactions: "fintrack-transactions",
    budget: "fintrack-monthly-budget",
    theme: "fintrack-theme"
};

/* -- 3. Local Storage -- */
function loadTransactions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.transactions);

        if (saved === null) {
            transactions = [];
            saveTransactions();
            return;
        }

        const parsed = JSON.parse(saved);

        transactions = Array.isArray(parsed)
            ? parsed.filter(transaction =>
                transaction &&
                typeof transaction.id === "string" &&
                typeof transaction.description === "string" &&
                transaction.description.trim() !== "" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0 &&
                ["income", "expense"].includes(transaction.type) &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
            )
            : [];
    } catch (error) {
        transactions = [];
        console.error("Unable to load transactions:", error);
        showToast("Saved transactions could not be loaded.", "error");
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.transactions,
            JSON.stringify(transactions)
        );

        return true;
    } catch (error) {
        console.error("Unable to save transactions:", error);
        showToast("Unable to save transactions on this device.", "error");
        return false;
    }
}

function loadBudget() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.budget);

        if (saved === null || saved.trim() === "") {
            monthlyBudget = 0;
            return;
        }

        const value = Number(saved);

        monthlyBudget = Number.isFinite(value) && value >= 0
            ? value
            : 0;
    } catch (error) {
        monthlyBudget = 0;
        console.error("Unable to load budget:", error);
    }
}

function saveBudget() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.budget,
            String(monthlyBudget)
        );

        return true;
    } catch (error) {
        console.error("Unable to save budget:", error);
        showToast("Unable to save your budget on this device.", "error");
        return false;
    }
}

function loadTheme() {
    try {
        currentTheme =
            localStorage.getItem(STORAGE_KEYS.theme) === "light"
                ? "light"
                : "dark";
    } catch (error) {
        currentTheme = "dark";
        console.error("Unable to load theme:", error);
    }
}

function saveTheme() {
    try {
        localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
    } catch (error) {
        console.error("Unable to save theme:", error);
    }
}

/* -- 4. Utility Functions -- */
const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? "Invalid date"
        : dateFormatter.format(date);
}

function generateTransactionId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getLocalDateString(date = new Date()) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function getCurrentMonthTransactions() {
    const now = new Date();

    return transactions.filter(transaction => {
        const date = new Date(`${transaction.date}T00:00:00`);

        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
        );
    });
}

function getCurrentMonthExpenses() {
    return getCurrentMonthTransactions()
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);
}

/* -- 5. Dashboard Summary -- */
function calculateTotalIncome() {
    return transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);
}

function calculateTotalExpenses() {
    return transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);
}

function updateDashboardSummary() {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    const balance = income - expenses;

    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expenses);
    currentBalance.textContent = formatCurrency(balance);

    balanceCard.classList.toggle("negative", balance < 0);

    balanceDescription.textContent = balance < 0
        ? "Your recorded expenses exceed your income."
        : "Your recorded income minus expenses.";
}

function updateCurrentDate() {
    currentDate.textContent = new Intl.DateTimeFormat("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}

/* -- 6. Transaction Management -- */
function getFilteredTransactions() {
    const query = transactionSearchQuery.toLowerCase().trim();

    return [...transactions]
        .filter(transaction => {
            const matchesSearch =
                transaction.description.toLowerCase().includes(query) ||
                transaction.category.toLowerCase().includes(query);

            const matchesCategory =
                activeCategoryFilter === "all" ||
                transaction.category === activeCategoryFilter;

            return matchesSearch && matchesCategory;
        })
        .sort((first, second) => second.date.localeCompare(first.date));
}

function renderTransactions() {
    const filtered = getFilteredTransactions();

    transactionList.replaceChildren();
    emptyState.hidden = filtered.length > 0;

    filtered.forEach(transaction => {
        const row = document.createElement("tr");
        const isIncome = transaction.type === "income";
        const amountClass = isIncome ? "amount-income" : "amount-expense";
        const amountSign = isIncome ? "+" : "-";
        const iconClass = isIncome ? "fa-arrow-down" : "fa-arrow-up";

        row.innerHTML = `
            <td>
                <div class="transaction-description">
                    <span class="transaction-icon">
                        <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
                    </span>
                    <div>
                        <p class="transaction-name">${escapeHTML(transaction.description)}</p>
                        <p class="transaction-subtitle">${escapeHTML(transaction.type)}</p>
                    </div>
                </div>
            </td>
            <td>
                <span class="transaction-category">
                    ${escapeHTML(transaction.category)}
                </span>
            </td>
            <td>${escapeHTML(formatDate(transaction.date))}</td>
            <td class="${amountClass}">
                ${amountSign}${escapeHTML(formatCurrency(transaction.amount))}
            </td>
            <td>
                <div class="transaction-actions">
                    <button
                        type="button"
                        data-action="edit"
                        data-id="${escapeHTML(transaction.id)}"
                        aria-label="Edit ${escapeHTML(transaction.description)}"
                        title="Edit transaction"
                    >
                        <i class="fa-solid fa-pen" aria-hidden="true"></i>
                    </button>
                    <button
                        type="button"
                        class="delete-transaction"
                        data-action="delete"
                        data-id="${escapeHTML(transaction.id)}"
                        aria-label="Delete ${escapeHTML(transaction.description)}"
                        title="Delete transaction"
                    >
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        `;

        transactionList.appendChild(row);
    });
}

function refreshDashboard() {
    updateDashboardSummary();
    renderTransactions();
    updateSpendingChart();
    updateBudgetTracker();
}

function addTransaction(data) {
    const transaction = {
        id: generateTransactionId(),
        ...data
    };

    transactions.push(transaction);

    if (!saveTransactions()) {
        transactions.pop();
        return false;
    }

    refreshDashboard();
    showToast("Transaction added successfully.", "success");

    return true;
}

function updateTransaction(id, data) {
    const index = transactions.findIndex(
        transaction => transaction.id === id
    );

    if (index === -1) return false;

    const previous = transactions[index];

    transactions[index] = {
        ...previous,
        ...data
    };

    if (!saveTransactions()) {
        transactions[index] = previous;
        return false;
    }

    refreshDashboard();
    showToast("Transaction updated successfully.", "success");

    return true;
}

function deleteTransaction(id) {
    const index = transactions.findIndex(
        transaction => transaction.id === id
    );

    if (index === -1) return;

    const [deleted] = transactions.splice(index, 1);

    if (!saveTransactions()) {
        transactions.splice(index, 0, deleted);
        return;
    }

    refreshDashboard();
    showToast("Transaction deleted successfully.", "success");
}

/* -- 7. Transaction Dialog -- */
function openTransactionDialog(transaction = null) {
    transactionForm.reset();

    editingTransactionId = transaction ? transaction.id : null;

    transactionDialogTitle.textContent = transaction
        ? "Edit Transaction"
        : "Add Transaction";

    saveTransactionButton.textContent = transaction
        ? "Save Changes"
        : "Save Transaction";

    transactionType.value = transaction?.type || "expense";
    transactionDescription.value = transaction?.description || "";
    transactionAmount.value = transaction?.amount ?? "";
    transactionCategory.value = transaction?.category || "Food";
    transactionDate.value = transaction?.date || getLocalDateString();

    transactionDialog.showModal();
    transactionDescription.focus();
}

function closeDialog() {
    if (transactionDialog.open) {
        transactionDialog.close();
    }

    editingTransactionId = null;
    transactionForm.reset();
}

function handleTransactionSubmit(event) {
    event.preventDefault();

    if (!transactionForm.reportValidity()) return;

    const amount = Number(transactionAmount.value);
    const description = transactionDescription.value.trim();
    const category = transactionCategory.value;
    const date = transactionDate.value;
    const type = transactionType.value;

    if (
        !description ||
        !category ||
        !date ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !["income", "expense"].includes(type)
    ) {
        showToast("Please enter valid transaction details.", "error");
        return;
    }

    const data = {
        description,
        amount,
        category,
        date,
        type
    };

    const saved = editingTransactionId
        ? updateTransaction(editingTransactionId, data)
        : addTransaction(data);

    if (saved) closeDialog();
}

/* -- 8. Spending Analytics -- */
function updateSpendingChart() {
    if (!spendingChart || !chartEmptyState || !chartLegend) return;

    if (typeof Chart === "undefined") {
        chartEmptyState.hidden = false;
        chartEmptyState.querySelector("p").textContent =
            "The chart library could not be loaded.";

        return;
    }

    const breakdown = {};

    getCurrentMonthTransactions()
        .filter(transaction => transaction.type === "expense")
        .forEach(transaction => {
            breakdown[transaction.category] =
                (breakdown[transaction.category] || 0) + transaction.amount;
        });

    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    spendingChartInstance?.destroy();
    spendingChartInstance = null;
    chartLegend.replaceChildren();

    if (labels.length === 0) {
        chartEmptyState.hidden = false;
        chartEmptyState.querySelector("p").textContent =
            "Your spending breakdown will appear here.";

        return;
    }

    chartEmptyState.hidden = true;

    const colors = [
        "#0D9488",
        "#16A34A",
        "#DC2626",
        "#D97706",
        "#2563EB",
        "#7C3AED",
        "#DB2777",
        "#0891B2"
    ];

    spendingChartInstance = new Chart(spendingChart, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(
                    (_, index) => colors[index % colors.length]
                ),
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });

    labels.forEach((label, index) => {
        const item = document.createElement("div");
        item.className = "legend-item";

        const marker = document.createElement("span");
        marker.className = "legend-color";
        marker.style.backgroundColor = colors[index % colors.length];

        const name = document.createElement("span");
        name.textContent = label;

        const amount = document.createElement("strong");
        amount.textContent = formatCurrency(values[index]);

        item.append(marker, name, amount);
        chartLegend.appendChild(item);
    });
}

/* -- 9. Budget Tracker -- */
function updateBudgetTracker() {
    const spent = getCurrentMonthExpenses();
    const remaining = monthlyBudget - spent;

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    const safePercentage = Math.min(Math.max(percentage, 0), 100);

    const fillClass = percentage > 100
        ? "over-budget"
        : percentage >= 80
            ? "warning"
            : "";

    budgetTotal.textContent = formatCurrency(monthlyBudget);
    budgetSpent.textContent = formatCurrency(spent);
    budgetRemaining.textContent = formatCurrency(remaining);

    budgetProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(safePercentage))
    );

    budgetProgressFill.style.width = `${safePercentage}%`;
    budgetProgressFill.classList.toggle("warning", fillClass === "warning");
    budgetProgressFill.classList.toggle("over-budget", fillClass === "over-budget");

    sidebarBudgetAmount.textContent = formatCurrency(monthlyBudget);

    sidebarBudgetProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(safePercentage))
    );

    sidebarBudgetFill.style.width = `${safePercentage}%`;
    sidebarBudgetFill.classList.toggle("warning", fillClass === "warning");
    sidebarBudgetFill.classList.toggle("over-budget", fillClass === "over-budget");

    budgetWarning.hidden = monthlyBudget <= 0 || spent <= monthlyBudget;

    budgetWarning.textContent = budgetWarning.hidden
        ? ""
        : `You are ${formatCurrency(spent - monthlyBudget)} over budget.`;

    if (monthlyBudget <= 0) {
        budgetStatus.textContent = "Set your monthly budget to get started.";
        sidebarBudgetNote.textContent = "No budget set";
    } else if (spent > monthlyBudget) {
        budgetStatus.textContent = "You have exceeded your monthly budget.";
        sidebarBudgetNote.textContent =
            `${formatCurrency(spent - monthlyBudget)} over budget`;
    } else if (percentage >= 80) {
        budgetStatus.textContent = "You're approaching your budget limit.";
        sidebarBudgetNote.textContent =
            `${formatCurrency(remaining)} remaining`;
    } else {
        budgetStatus.textContent = "You're within your budget.";
        sidebarBudgetNote.textContent =
            `${formatCurrency(remaining)} remaining`;
    }
}

function handleBudgetSubmit(event) {
    event.preventDefault();

    const input = monthlyBudgetInput.value.trim();
    const value = Number(input);

    if (
        input === "" ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        showToast("Enter a valid budget amount.", "error");
        return;
    }

    const previous = monthlyBudget;
    monthlyBudget = value;

    if (!saveBudget()) {
        monthlyBudget = previous;
        return;
    }

    monthlyBudgetInput.value = String(monthlyBudget);

    updateBudgetTracker();
    showToast("Monthly budget saved.", "success");
}

/* -- 10. CSV Export -- */
function exportTransactionsToCSV() {
    if (transactions.length === 0) {
        showToast("There are no transactions to export.", "error");
        return;
    }

    const headers = [
        "Description",
        "Type",
        "Category",
        "Amount",
        "Date"
    ];

    const rows = transactions.map(transaction => [
        transaction.description,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.date
    ]);

    const escapeCSV = value => {
        let text = String(value);

        if (/^[=+\-@]/.test(text)) {
            text = `'${text}`;
        }

        return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fintrack-transactions-${getLocalDateString()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast("Transactions exported successfully.", "success");
}

/* -- 11. Theme Toggle -- */
function applyTheme() {
    const isLight = currentTheme === "light";

    document.body.classList.toggle("light-theme", isLight);

    themeToggle.setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
    );

    themeToggle.setAttribute("aria-pressed", String(isLight));

    const icon = themeToggle.querySelector("i");

    if (icon) {
        icon.className = isLight
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";
    }
}

function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme();
    saveTheme();
}

/* -- 12. Sidebar Navigation -- */
function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;

    sidebar.classList.toggle("open", isSidebarOpen);
    sidebarBackdrop.hidden = !isSidebarOpen;

    sidebarToggle.setAttribute(
        "aria-expanded",
        String(isSidebarOpen)
    );

    sidebarToggle.setAttribute(
        "aria-label",
        isSidebarOpen ? "Close navigation" : "Open navigation"
    );
}

function closeSidebar() {
    isSidebarOpen = false;

    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;

    sidebarToggle.setAttribute("aria-expanded", "false");
    sidebarToggle.setAttribute("aria-label", "Open navigation");
}

/* -- 13. Notifications -- */
function showToast(message, type = "success") {
    if (!toastContainer) return;

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;

    toastContainer.appendChild(toast);

    window.setTimeout(() => toast.remove(), 3500);
}

/* -- 14. Event Listeners -- */
function initializeEventListeners() {
    addTransactionButton.addEventListener(
        "click",
        () => openTransactionDialog()
    );

    transactionForm.addEventListener(
        "submit",
        handleTransactionSubmit
    );

    closeTransactionDialog.addEventListener("click", closeDialog);
    cancelTransaction.addEventListener("click", closeDialog);

    budgetForm.addEventListener("submit", handleBudgetSubmit);

    exportCsvButton.addEventListener(
        "click",
        exportTransactionsToCSV
    );

    themeToggle.addEventListener("click", toggleTheme);
    sidebarToggle.addEventListener("click", toggleSidebar);
    sidebarBackdrop.addEventListener("click", closeSidebar);

    transactionDialog.addEventListener("click", event => {
        if (event.target === transactionDialog) {
            closeDialog();
        }
    });

    transactionList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const transaction = transactions.find(
            item => item.id === button.dataset.id
        );

        if (!transaction) return;

        if (button.dataset.action === "edit") {
            openTransactionDialog(transaction);
        }

        if (
            button.dataset.action === "delete" &&
            window.confirm(`Delete "${transaction.description}"?`)
        ) {
            deleteTransaction(transaction.id);
        }
    });

    transactionSearch.addEventListener("input", event => {
        transactionSearchQuery = event.target.value;
        renderTransactions();
    });

    categoryFilter.addEventListener("change", event => {
        activeCategoryFilter = event.target.value;
        renderTransactions();
    });

    sidebar.querySelectorAll(".sidebar-nav a").forEach(link => {
        link.addEventListener("click", () => {
            closeSidebar();

            document.querySelectorAll(".nav-link").forEach(navLink => {
                navLink.classList.remove("active");
            });

            link.classList.add("active");
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 700) {
            closeSidebar();
        }
    });
}

/* -- 15. Initialization -- */
function initializeApp() {
    loadTransactions();
    loadBudget();
    loadTheme();

    applyTheme();
    updateCurrentDate();

    monthlyBudgetInput.value = monthlyBudget > 0
        ? String(monthlyBudget)
        : "";

    refreshDashboard();
    initializeEventListeners();
}
initializeApp();