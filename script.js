window.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTIONS ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');

    // --- STATE ---
    let tasks = JSON.parse(localStorage.getItem('forgetful_tasks')) || [];

    // --- FUNCTIONS ---
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

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
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

        const taskTextElement = document.createElement('span');
        taskTextElement.innerText = task.current;

        // --- NEW: Create the mutate button ---
        const mutateBtn = document.createElement('button');
        mutateBtn.innerText = '🌀'; // A swirl emoji for mutate
        mutateBtn.className = 'mutate-btn';

        // --- NEW: Add event listener for the mutate button ---
        mutateBtn.addEventListener('click', async () => {
            await mutateTaskAPI(task); // Call the API for this specific task
            saveAndRender(); // Re-render the list to show the change
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '🗑️';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        // Add all elements to the task item
        taskElement.appendChild(taskTextElement);
        taskElement.appendChild(mutateBtn); // Add the new button
        taskElement.appendChild(deleteBtn);

        taskListContainer.appendChild(taskElement);
    });
}

    // --- SECURE AI MUTATION FUNCTION ---
    async function mutateTaskAPI(taskToMutate) {
       const FUNCTION_URL = '/.netlify/functions/mutate';

        const prompt = `You are a 'Forgetful Assistant'. Mutate this to-do task into a related but slightly different task. The goal is a slow drift away from the original intent. Respond ONLY with a JSON object like {"newTask": "the new task description"}.
        
        Current Task to Mutate: "${taskToMutate.current}"
        Generate the next task.`;

        try {
            const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) return taskToMutate;

            const data = await response.json();
            console.log("AI Response Data:", data);
            const mutatedText = data.rawText;
const cleanedJsonString = mutatedText.replace(/```json/g, '').replace(/```/g, '').trim();
const mutatedJson = JSON.parse(cleanedJsonString);
            
            taskToMutate.current = mutatedJson.newTask;
            taskToMutate.history.push(mutatedJson.newTask);

            return taskToMutate;
        } catch (error) {
            console.error("Failed to mutate task:", error);
            return taskToMutate;
        }
    }

    // --- PAGE LOAD LOGIC ---
  async function handlePageLoad() {
    // 1. Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeToggleBtn.innerText = '🌙';
    }

    // 2. Just render the tasks without mutating them
    renderTasks();
}

    // --- EVENT LISTENERS ---
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
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

    // --- INITIAL KICK-OFF ---
    handlePageLoad();
});