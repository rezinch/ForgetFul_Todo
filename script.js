window.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');

    let tasks = JSON.parse(localStorage.getItem('forgetful_tasks')) || [];

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
        taskListContainer.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerText = task.current;
            taskListContainer.appendChild(taskElement);
        });
    }

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    renderTasks();
});