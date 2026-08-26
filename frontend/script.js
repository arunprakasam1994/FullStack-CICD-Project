// Change this if your backend runs elsewhere (e.g. behind Nginx use "/api/tasks")
const API_URL = "/api/tasks";

const form = document.getElementById("task-form");
const list = document.getElementById("task-list");

async function fetchTasks() {
  const res = await fetch(API_URL);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  list.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const span = document.createElement("span");
    span.className = "title";
    span.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "actions";

    const doneBtn = document.createElement("button");
    doneBtn.className = "done";
    doneBtn.textContent = task.completed ? "Undo" : "Done";
    doneBtn.onclick = () => toggleComplete(task);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteTask(task._id);

    actions.appendChild(doneBtn);
    actions.appendChild(delBtn);

    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

async function toggleComplete(task) {
  await fetch(`${API_URL}/${task._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: !task.completed }),
  });
  fetchTasks();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  fetchTasks();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });

  form.reset();
  fetchTasks();
});

fetchTasks();
