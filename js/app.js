// ========================================
// HelpDeskCollege — система заявок
// ========================================

// Начальные данные для демонстрации
const initialRequests = [
    {
        id: 1001,
        title: "Не работает компьютер",
        category: "Оборудование",
        status: "Новая",
        priority: "Высокий"
    },
    {
        id: 1002,
        title: "Ошибка при запуске программы",
        category: "Программное обеспечение",
        status: "В работе",
        priority: "Обычный"
    },
    {
        id: 1003,
        title: "Нет доступа к интернету",
        category: "Сеть",
        status: "Новая",
        priority: "Критический"
    },
    {
        id: 1004,
        title: "Не открывается личный кабинет",
        category: "Доступ",
        status: "В работе",
        priority: "Высокий"
    },
    {
        id: 1005,
        title: "Требуется установка принтера",
        category: "Оборудование",
        status: "Новая",
        priority: "Обычный"
    }
];

// Загружаем данные из браузера или используем начальные
let requests = JSON.parse(
    localStorage.getItem("helpDeskRequests")
) || initialRequests;

// Сохраняем изменения
function saveRequests() {
    localStorage.setItem(
        "helpDeskRequests",
        JSON.stringify(requests)
    );
}

// ========================================
// Отображение заявок
// ========================================

function renderRequests() {
    const table = document.getElementById("requestTable");

    const search = document
        .getElementById("searchInput")
        .value.toLowerCase();

    const status = document
        .getElementById("statusFilter")
        .value;

    const filtered = requests.filter(request => {
        const matchesSearch = request.title
            .toLowerCase()
            .includes(search);

        const matchesStatus =
            status === "Все" || request.status === status;

        return matchesSearch && matchesStatus;
    });

    table.innerHTML = "";

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">Заявки не найдены</td>
            </tr>
        `;
    }

    filtered.forEach(request => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${request.id}</td>
            <td>${escapeHTML(request.title)}</td>
            <td>${escapeHTML(request.category)}</td>
            <td>
                <select onchange="changeStatus(${request.id}, this.value)">
                    ${["Новая", "В работе", "Завершена", "Отклонена"]
                        .map(status => `
                            <option value="${status}"
                                ${request.status === status ? "selected" : ""}>
                                ${status}
                            </option>
                        `).join("")}
                </select>
            </td>
            <td>${escapeHTML(request.priority)}</td>
            <td>
                <button class="action-btn"
                    onclick="deleteRequest(${request.id})">
                    Удалить
                </button>
            </td>
        `;

        table.appendChild(row);
    });

    updateStatistics();
}

// Защита текста от вставки HTML-разметки
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "'"
    })[char]);
}

// ========================================
// Статистика
// ========================================

function updateStatistics() {
    document.getElementById("totalCount").textContent =
        requests.length;

    document.getElementById("newCount").textContent =
        requests.filter(r => r.status === "Новая").length;

    document.getElementById("progressCount").textContent =
        requests.filter(r => r.status === "В работе").length;

    document.getElementById("doneCount").textContent =
        requests.filter(r => r.status === "Завершена").length;
}

// ========================================
// Изменение статуса
// ========================================

function changeStatus(id, newStatus) {
    const request = requests.find(r => r.id === id);

    if (!request) return;

    request.status = newStatus;

    saveRequests();
    renderRequests();
}

// ========================================
// Удаление заявки
// ========================================

function deleteRequest(id) {
    const confirmed = confirm(
        "Вы действительно хотите удалить эту заявку?"
    );

    if (!confirmed) return;

    requests = requests.filter(r => r.id !== id);

    saveRequests();
    renderRequests();
}

// ========================================
// Создание новой заявки
// ========================================

function addNewRequest() {
    const title = prompt("Введите название заявки:");

    if (!title || !title.trim()) {
        alert("Название заявки не может быть пустым.");
        return;
    }

    const category = prompt(
        "Введите категорию:\nОборудование\nПрограммное обеспечение\nСеть\nДоступ"
    );

    const allowedCategories = [
        "Оборудование",
        "Программное обеспечение",
        "Сеть",
        "Доступ"
    ];

    if (!allowedCategories.includes(category)) {
        alert("Указана неизвестная категория.");
        return;
    }

    const nextId = Math.max(1000, ...requests.map(r => r.id)) + 1;

    requests.push({
        id: nextId,
        title: title.trim(),
        category: category,
        status: "Новая",
        priority: "Обычный"
    });

    saveRequests();
    renderRequests();

    alert("Заявка успешно добавлена!");
}

// ========================================
// Поиск и фильтрация
// ========================================

document.getElementById("searchInput")
    .addEventListener("input", renderRequests);

document.getElementById("statusFilter")
    .addEventListener("change", renderRequests);

document.getElementById("addRequest")
    .addEventListener("click", addNewRequest);

// ========================================
// Запуск приложения
// ========================================

renderRequests();

console.log("HelpDeskCollege успешно запущен!");