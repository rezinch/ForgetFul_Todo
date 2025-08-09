window.addEventListener('DOMContentLoaded', () => {
    // All element selections and event listeners should be inside here
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');

    let tasks = JSON.parse(localStorage.getItem('forgetful_tasks')) || [];

    // --- All your functions like addTask, saveAndRender, etc. go here ---
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const newTask = {
            id: Date.now().toString(),
            original: taskText,
            current: taskText,
            history: [taskText]
        };

        tasks.push(newTask);
        taskInput.value = '';
        saveAndRender();
    }

    function saveAndRender() {
        localStorage.setItem('forgetful_tasks', JSON.stringify(tasks));
        renderTasks();
    }

 function renderTasks() {
    taskListContainer.innerHTML = ''; // Clear the current list
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';

        // Create a span for the task text
        const taskTextElement = document.createElement('span');
        taskTextElement.innerText = task.current;

        // Create the delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '🗑️';
        deleteBtn.className = 'delete-btn';

        // Add an event listener to the delete button
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
        });

        // Add the text and button to the task item
        taskElement.appendChild(taskTextElement);
        taskElement.appendChild(deleteBtn);

        // Add the task item to the main list container
        taskListContainer.appendChild(taskElement);
    });
}

function deleteTask(taskId) {
    // Create a new array containing every task EXCEPT the one with the matching ID
    tasks = tasks.filter(task => task.id !== taskId);

    // Save the new, smaller list and update the screen
    saveAndRender();
}
    // --- End of functions ---


    // --- All your event listeners go here ---
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Event listener for the theme toggle button
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');

        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerText = '🌙';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerText = '☀️';
        }
    });
    // --- End of event listeners ---


    // --- Code to run on page load goes here ---
    // Load saved theme and apply it
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeToggleBtn.innerText = '🌙';
    }

    // Initial render of tasks
    renderTasks();
});