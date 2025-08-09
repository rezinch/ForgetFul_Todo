window.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTIONS ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mutateAllBtn = document.getElementById('mutate-all-btn');
    const body = document.body;
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');

    // --- STATE ---
    let tasks = JSON.parse(localStorage.getItem('forgetful_tasks')) || [];

    // --- NEW: Animation Function ---
    function animateTextScramble(element, newText) {
        const oldText = element.innerText;
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        const duration = 800; // Total animation time in milliseconds
        const frameRate = 30; // Frames per second
        const totalFrames = duration / (1000 / frameRate);
        let frame = 0;

        const interval = setInterval(() => {
            let output = '';
            for (let i = 0; i < newText.length; i++) {
                const progress = frame / totalFrames;
                if (i < newText.length * progress) {
                    output += newText[i];
                } else {
                    const charIndex = Math.floor(Math.random() * chars.length);
                    output += chars[charIndex];
                }
            }
            // For a smoother effect, we can also scramble the remaining part of the old text
            for (let i = newText.length; i < oldText.length; i++) {
                 const charIndex = Math.floor(Math.random() * chars.length);
                 output += chars[charIndex];
            }

            element.innerText = output;
            
            if (frame >= totalFrames) {
                element.innerText = newText;
                clearInterval(interval);
            }
            frame++;
        }, 1000 / frameRate);
    }

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
        taskListContainer.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            
            const taskTextElement = document.createElement('span');
            taskTextElement.innerText = task.current;
            taskTextElement.id = `task-text-${task.id}`; // Add unique ID
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = '🗑️';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskElement.appendChild(taskTextElement);

            taskElement.appendChild(deleteBtn);
            
            taskListContainer.appendChild(taskElement);
        });
    }

    // --- AI MUTATION FUNCTION ---
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
            const mutatedText = data.rawText;

            if (!mutatedText) {
                console.error("AI did not return a valid mutation.", data);
                return taskToMutate;
            }
            
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

    // Updated function to handle mutating tasks with animation
    async function mutateAllTasks() {
        const oldTasks = JSON.parse(JSON.stringify(tasks)); // Deep copy old tasks

        const mutationPromises = tasks.map(task => {
            if (Math.random() < 0.7) {
                return mutateTaskAPI(task); 
            }
            return Promise.resolve(task); 
        });
        const newTasks = await Promise.all(mutationPromises);

        // Animate changes before saving and re-rendering
        newTasks.forEach((newTask, index) => {
            const oldTask = oldTasks[index];
            if (newTask.current !== oldTask.current) {
                const textElement = document.getElementById(`task-text-${newTask.id}`);
                if (textElement) {
                    animateTextScramble(textElement, newTask.current);
                }
            }
        });
        
        // Update the main tasks array and save to localStorage
        tasks = newTasks;
        localStorage.setItem('forgetful_tasks', JSON.stringify(tasks));
        // We don't call saveAndRender immediately to let the animation play
    }

    // --- PAGE LOAD LOGIC ---
    async function handlePageLoad() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-mode');
            themeToggleBtn.innerText = '🌙';
        }

        renderTasks(); // Render initial tasks first
        await mutateAllTasks(); // Then mutate them
    }

    // --- EVENT LISTENERS ---
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerText = '�';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerText = '☀️';
        }
    });
    mutateAllBtn.addEventListener('click', mutateAllTasks);

    // --- INITIAL KICK-OFF ---
    handlePageLoad();
});