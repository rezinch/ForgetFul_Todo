window.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTIONS ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mutateAllBtn = document.getElementById('mutate-all-btn');
    const autoMutateCheckbox = document.getElementById('auto-mutate-checkbox');
    const autoMutateSwitchContainer = document.querySelector('.auto-mutate-switch');
    const mutateLoader = document.getElementById('mutate-loader');
    const body = document.body;
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');

    // --- STATE ---
    let tasks = JSON.parse(localStorage.getItem('forgetful_tasks')) || [];
    let autoMutateInterval = null;

    // --- Animation Function ---
    function animateTextScramble(element, newText, taskHistory) {
        const oldText = element.innerText;
        const chars = '!<>-_\\/[]{}—=+*^?#';
        const glitchWords = ['Processing...', 'Rerouting...', 'Compiling...', 'Forget...', 'Remember?', 'Wait...', ...taskHistory];
        const duration = 1200;
        const frameRate = 30;
        const totalFrames = duration / (1000 / frameRate);
        let frame = 0;

        const interval = setInterval(() => {
            const progress = frame / totalFrames;
            const revealedLength = Math.floor(newText.length * progress);
            let output = newText.substring(0, revealedLength);
            
            let scramblePart = '';
            for (let i = revealedLength; i < oldText.length; i++) {
                if (Math.random() < 0.05 && glitchWords.length > 0) {
                    const word = glitchWords[Math.floor(Math.random() * glitchWords.length)];
                    scramblePart += ` ${word} `;
                    i += word.length;
                } else {
                    scramblePart += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            
            output += output.length < oldText.length ? scramblePart.substring(0, oldText.length - output.length) : '';
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
        const newTask = { id: Date.now().toString(), original: taskText, current: taskText, history: [taskText] };
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
            taskTextElement.id = `task-text-${task.id}`; 

            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = '🗑️';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskElement.appendChild(taskTextElement);
            taskElement.appendChild(deleteBtn);
            taskListContainer.appendChild(taskElement);
        });
    }

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

    async function mutateAllTasks() {
        // Trigger the loading animation if the switch is on
        if (autoMutateCheckbox.checked) {
            mutateLoader.classList.add('is-mutating');
            // Listen for the animation to end, then remove the class.
            // This makes it play exactly once per function call.
            mutateLoader.addEventListener('animationend', () => {
                mutateLoader.classList.remove('is-mutating');
            }, { once: true }); // {once: true} is crucial
        }

        const oldTasks = JSON.parse(JSON.stringify(tasks));
        const mutationPromises = tasks.map(task => {
            if (Math.random() < 0.7) {
                return mutateTaskAPI(task);
            }
            return Promise.resolve(task);
        });
        const newTasks = await Promise.all(mutationPromises);

        newTasks.forEach((newTask, index) => {
            const oldTask = oldTasks[index];
            if (newTask.current !== oldTask.current) {
                const textElement = document.getElementById(`task-text-${newTask.id}`);
                if (textElement) {
                    animateTextScramble(textElement, newTask.current, newTask.history);
                }
            }
        });

        tasks = newTasks;
        localStorage.setItem('forgetful_tasks', JSON.stringify(tasks));
    }

    // --- PAGE LOAD LOGIC ---
    async function handlePageLoad() {
        // Restore theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-mode');
            themeToggleBtn.innerText = '🌙';
        }

        // Restore auto-mutate state
        const isAutoMutateEnabled = JSON.parse(localStorage.getItem('autoMutateEnabled'));
        if (isAutoMutateEnabled) {
            autoMutateCheckbox.checked = true;
            autoMutateSwitchContainer.classList.add('active'); // Show loader icon
            if (autoMutateInterval) clearInterval(autoMutateInterval);
            autoMutateInterval = setInterval(mutateAllTasks, 10000);
        }

        // Initial render and mutation
        renderTasks(); 
        await mutateAllTasks(); 
    }

    // --- EVENT LISTENERS ---
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    
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

    mutateAllBtn.addEventListener('click', mutateAllTasks);

    autoMutateCheckbox.addEventListener('change', () => {
        // Save state
        localStorage.setItem('autoMutateEnabled', autoMutateCheckbox.checked);

        if (autoMutateCheckbox.checked) {
            autoMutateSwitchContainer.classList.add('active'); // Show loader
            if (autoMutateInterval) clearInterval(autoMutateInterval);
            autoMutateInterval = setInterval(mutateAllTasks, 10000);
        } else {
            autoMutateSwitchContainer.classList.remove('active'); // Hide loader
            clearInterval(autoMutateInterval);
        }
    });

    // --- INITIAL KICK-OFF ---
    handlePageLoad();
});