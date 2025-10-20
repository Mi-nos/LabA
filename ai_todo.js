class TodoList {
    constructor({ listId, inputId, dateId, addBtnId, searchId, storageKey = "todo.tasks" }) {
        this.list = document.getElementById(listId);
        this.txt = document.getElementById(inputId);
        this.due = document.getElementById(dateId);
        this.addBtn = document.getElementById(addBtnId);
        this.search = document.getElementById(searchId);
        this.storageKey = storageKey;

        this.tasks = this.loadTasks();
        this.editing = null;
        this.filter = "";

        if (this.txt) this.txt.maxLength = 255;

        this.bindEvents();
        this.draw();
    }
    //do dat
    pad(n) { return String(n).padStart(2, "0"); }
    today(d = new Date()) { return `${d.getFullYear()}-${this.pad(d.getMonth()+1)}-${this.pad(d.getDate())}`; }

    loadTasks() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [
            { text: "Kupić mleko", due: this.today() },
            { text: "Znaleźć praktyki", due: this.today(new Date(Date.now()+86400000)) },
            { text: "Zrobić zadanie z JS", due: this.today(new Date(Date.now()+2*86400000)) }
        ];
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    //na skrypty
    esc(s) {
        return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    }

    highlight(txt, q) {
        if (!q || q.length < 2) return this.esc(txt);
        return this.esc(txt).replace(
            new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),
            m => `<mark>${m}</mark>`
        );
    }

    validName(n) { return n.length >= 3 && n.length <= 255; }
    validDate(d) { return !d || d >= this.today(); }

    bindEvents() {
        this.addBtn.onclick = () => this.addTask();
        this.search.oninput = () => this.draw(this.search.value);
    }

    addTask() {
        const text = this.txt.value.trim();
        const dueVal = this.due.value;

        if (!this.validName(text)) return alert("Nazwa musi mieć 3–255 znaków.");
        if (!this.validDate(dueVal)) return alert("Data musi być pusta lub dziś/później.");

        this.tasks.push({ text, due: dueVal });
        this.txt.value = this.due.value = "";
        this.save();
        this.draw(this.search.value);
    }

    draw(filter = "") {
        this.filter = filter.length >= 2 ? filter.toLowerCase() : "";
        this.list.innerHTML = "";

        this.tasks.forEach((t, i) => {
            if (this.filter && !t.text.toLowerCase().includes(this.filter)) return;

            const li = document.createElement("li");
            li.setAttribute("data-index", i);

            // Jeśli edycja
            if (this.editing === i) {
                const inputName = document.createElement("input");
                inputName.className = "edit-name";
                inputName.value = t.text;

                inputName.onkeydown = e => {
                    if (e.key === "Enter") inputName.blur();
                    if (e.key === "Escape") { this.editing = null; this.draw(this.filter); }
                };

                inputName.onblur = () => {
                    const val = inputName.value.trim();
                    if (!this.validName(val)) return alert("Nazwa musi mieć 3–255 znaków.");
                    t.text = val;
                    this.editing = null;
                    this.save();
                    this.draw(this.filter);
                };

                li.appendChild(inputName);
            } else {
                const span = document.createElement("span");
                span.className = "task-name";
                span.innerHTML = this.highlight(t.text, this.filter);
                li.appendChild(span);
            }

            // Input daty
            const date = document.createElement("input");
            date.type = "date";
            date.className = "task-date";
            date.value = t.due || "";

            date.onclick = e => e.stopPropagation();
            date.oninput = e => {
                t.due = this.validDate(e.target.value) ? e.target.value : (alert("Data pusta albo dzisiaj/później"), e.target.value="", "");
                this.save();
            };

            li.appendChild(date);

            // Przycisk Usuń — moja porażka, miałem problemy z ustawieniem htmlowego
            const del = document.createElement("button");
            del.className = "del";
            del.textContent = "🗑️";
            del.onclick = e => {
                e.stopPropagation();
                this.tasks.splice(i, 1);
                if (this.editing === i) this.editing = null;
                this.save();
                this.draw(this.filter);
            };
            li.appendChild(del);

            // Kliknięcie w li = start edycji
            if (this.editing !== i) {
                li.onclick = e => {
                    if (!e.target.closest(".task-date,.del")) {
                        this.editing = i;
                        this.draw(this.filter);
                    }
                };
            }

            this.list.appendChild(li);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new TodoList({
        listId: "taskList",
        inputId: "newTask",
        dateId: "dueDate",
        addBtnId: "addTaskBtn",
        searchId: "search"
    });
});
