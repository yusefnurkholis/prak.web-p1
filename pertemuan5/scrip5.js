document.addEventListener("DOMContentLoaded", () => {
    const todoForm = document.querySelector("#todoForm");
    const taskInput = document.querySelector("#taskInput");
    const inputError = document.querySelector("#inputError");
    const todoList = document.querySelector("#todoList");
    const taskCounter = document.querySelector("#taskCounter");
    const clearCompletedBtn = document.querySelector("#clearCompletedBtn");
    const confirmOverlay = document.querySelector("#confirmOverlay");
    const confirmTitle = document.querySelector("#confirmTitle");
    const confirmMessage = document.querySelector("#confirmMessage");
    const cancelConfirm = document.querySelector("#cancelConfirm");
    const acceptConfirm = document.querySelector("#acceptConfirm");
    const storageKey = "todo_tasks";
    let resolveConfirmation = null;
    let previouslyFocusedElement = null;

    const closeConfirmation = (confirmed) => {
        confirmOverlay.hidden = true;
        document.body.style.overflow = "";
        const resolve = resolveConfirmation;
        resolveConfirmation = null;
        if (previouslyFocusedElement instanceof HTMLElement) previouslyFocusedElement.focus();
        if (resolve) resolve(confirmed);
    };

    const askForConfirmation = (title, message, confirmLabel) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        acceptConfirm.textContent = confirmLabel;
        previouslyFocusedElement = document.activeElement;
        confirmOverlay.hidden = false;
        document.body.style.overflow = "hidden";
        cancelConfirm.focus();
        return new Promise((resolve) => {
            resolveConfirmation = resolve;
        });
    };

    cancelConfirm.addEventListener("click", () => closeConfirmation(false));
    acceptConfirm.addEventListener("click", () => closeConfirmation(true));
    confirmOverlay.addEventListener("click", (event) => {
        if (event.target === confirmOverlay) closeConfirmation(false);
    });
    document.addEventListener("keydown", (event) => {
        if (!confirmOverlay.hidden && event.key === "Escape") closeConfirmation(false);
    });

    const getTasks = () => {
        try {
            const tasks = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return Array.isArray(tasks) ? tasks : [];
        } catch {
            return [];
        }
    };

    const saveTasks = (tasks) => localStorage.setItem(storageKey, JSON.stringify(tasks));

    const showError = (message) => {
        taskInput.classList.add("error");
        inputError.textContent = message;
        inputError.style.display = "block";
    };

    const clearError = () => {
        taskInput.classList.remove("error");
        inputError.textContent = "";
        inputError.style.display = "none";
    };

    const renderTasks = () => {
        const tasks = getTasks();
        const completedCount = tasks.filter((task) => task.completed).length;
        const pendingCount = tasks.length - completedCount;

        taskCounter.textContent = `Total: ${tasks.length} Tugas | Selesai: ${completedCount} | Belum Selesai: ${pendingCount}`;
        clearCompletedBtn.disabled = completedCount === 0;
        todoList.replaceChildren();

        if (tasks.length === 0) {
            const emptyMessage = document.createElement("li");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "Belum ada tugas tersimpan.";
            todoList.appendChild(emptyMessage);
            return;
        }

        tasks.forEach((task, index) => {
            const item = document.createElement("li");
            item.className = `todo-item${task.completed ? " completed" : ""}`;

            const text = document.createElement("span");
            text.className = "todo-text";
            text.textContent = task.text;

            const actions = document.createElement("div");
            actions.className = "todo-actions";

            const completeButton = document.createElement("button");
            completeButton.type = "button";
            completeButton.className = "action-btn complete-btn";
            completeButton.dataset.index = index;
            completeButton.textContent = task.completed ? "Batal" : "Selesai";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "action-btn delete-btn";
            deleteButton.dataset.index = index;
            deleteButton.textContent = "Hapus";

            actions.append(completeButton, deleteButton);
            item.append(text, actions);
            todoList.appendChild(item);
        });
    };

    todoForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const taskText = taskInput.value.trim();
        const tasks = getTasks();

        if (taskText.length < 3) {
            showError("Tugas harus terdiri dari minimal 3 karakter.");
            taskInput.focus();
            return;
        }

        if (tasks.length >= 5) {
            showError("Maksimal 5 tugas. Hapus tugas terlebih dahulu untuk menambahkan tugas baru.");
            taskInput.focus();
            return;
        }

        tasks.push({ text: taskText, completed: false });
        saveTasks(tasks);
        clearError();
        taskInput.value = "";
        renderTasks();
        taskInput.focus();
    });

    taskInput.addEventListener("input", clearError);

    todoList.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-index]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const tasks = getTasks();
        if (!Number.isInteger(index) || !tasks[index]) return;

        if (button.classList.contains("complete-btn")) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks(tasks);
            renderTasks();
            return;
        }

        if (button.classList.contains("delete-btn")) {
            const confirmed = await askForConfirmation(
                "Hapus tugas ini?",
                `Tugas “${tasks[index].text}” akan dihapus secara permanen.`,
                "Ya, hapus"
            );
            if (!confirmed) return;
            tasks.splice(index, 1);
            saveTasks(tasks);
            renderTasks();
        }
    });

    clearCompletedBtn.addEventListener("click", async () => {
        const tasks = getTasks();
        const remainingTasks = tasks.filter((task) => !task.completed);
        const completedCount = tasks.length - remainingTasks.length;
        if (completedCount === 0) return;

        const confirmed = await askForConfirmation(
            "Bersihkan tugas selesai?",
            `Sebanyak ${completedCount} tugas selesai akan dihapus. Tugas yang belum selesai tetap tersimpan.`,
            "Ya, bersihkan"
        );
        if (!confirmed) return;

        saveTasks(remainingTasks);
        renderTasks();
    });

    renderTasks();
});
