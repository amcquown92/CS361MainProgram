const taskForm = document.getElementById("task-form");
const confirmCloseDialog = document.getElementById("confirm-close-dialog");
const openTaskFormBtn = document.getElementById("open-task-form-btn");
const closeTaskFormBtn = document.getElementById("close-task-form-btn");
const addOrUpdateTaskBtn = document.getElementById("add-or-update-task-btn");
const cancelBtn = document.getElementById("cancel-btn");
const discardBtn = document.getElementById("discard-btn");
const tasksContainer = document.getElementById("tasks-container");
const titleInput = document.getElementById("title-input");
const dateInput = document.getElementById("date-input");
const descriptionInput = document.getElementById("description-input");
const priorityInput = document.getElementById("priority-input")
const addTaskDialog = document.getElementById("add-task-dialog")
const discardMsg1 = document.getElementById("discard-msg1")
const discardMsg2 = document.getElementById("discard-msg2")

const taskData = [];
let currentTask = {}

/*--------------------------------------
Creates a task object using the input values. If an ID is already present in `currentTask`, it implies an update.
    Otherwise, a new unique ID is generated for the task.

----------------------------------------*/
const addOrUpdateTask = async() =>{
    const taskObj = {
        id: currentTask.id || `${titleInput.value.toLowerCase().split(" ").join("-")}-${Date.now()}`,
        title: titleInput.value,
        date: dateInput.value,
        description: descriptionInput.value,
        priority: priorityInput.value
    };

/*--------------------------------------
Checks if the task is an update or a new task and sends the appropriate HTTP request to update or create it in the backend.

----------------------------------------*/

    if (currentTask.id) {
        // Update task in the back-end
        await fetch(`http://localhost:8080/tasks/${taskObj.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskObj)
        });
    } else {
        // Add a new task in the back-end
        await fetch('http://localhost:8080/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskObj)
        });
    }
/*--------------------------------------
Reloads tasks from the backend after adding or updating a task, then resets the form fields.

----------------------------------------*/
    await loadTasksFromBackend();
    reset();
};
/*--------------------------------------
Clears the current contents of `tasksContainer` and repopulates it with updated task data.

----------------------------------------*/
const updateTaskContainer = () => {
    tasksContainer.innerHTML = ""

    taskData.forEach(
        ({ id, title, date, description, priority }) => {
            tasksContainer.innerHTML += `
            <div class="task" id="${id}">
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Due Date:</strong> ${date}</p>
                <p><strong>Priority:</strong> ${priority}</p>
                <p><strong>Description:</strong> ${description}</p>
                <button onclick="editTask(this)" type="button" class="btn add-edit-btn">  <i class="fas fa-pencil-alt"></i> Edit</button>
                <button onclick="deleteTask(this)" type="button" class="btn delete-btn"> <i class="fas fa-trash-alt"></i> Delete</button>
            </div>
            `
        }
    );
};
const deleteTask = (buttonEl) => {
    const taskId = buttonEl.parentElement.id;

    // Show the confirmation modal
    confirmCloseDialog.showModal();
    discardMsg1.innerText = "Discard Task?";
    discardMsg2.innerText = "This action is permanent. Deleted tasks cannot be recovered. Continue?";
    
    discardBtn.onclick = null; // Clear previous event
    discardBtn.onclick = async () => {
        confirmCloseDialog.close(); // Close modal
        try {
            // Proceed with the deletion if confirmed
            const response = await fetch(`http://localhost:8080/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadTasksFromBackend(); // Refresh task list
            } else {
                console.error('Failed to delete task:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };
};

/*--------------------------------------
findIndex checks each item in taskData to see if item.id matches buttonEl.parentElement.id.
    buttonEl.parentElement.id is the ID of the parent element (the task divthat contains buttonEl).
    If item.id matches buttonEl.parentElement.id, findIndex returns the index of that item in taskData.

----------------------------------------*/
const editTask = (buttonEl) => {
    const dataArrIndex = taskData.findIndex(
        (item) => item.id === buttonEl.parentElement.id
    );

    currentTask = taskData[dataArrIndex];

    titleInput.value = currentTask.title;
    dateInput.value = currentTask.date;
    descriptionInput.value = currentTask.description;
    priorityInput.value = currentTask.priority

    addOrUpdateTaskBtn.innerText = "Update Task";

    taskForm.classList.toggle("hidden"); 
}

/*--------------------------------------
Resets the input fields and clears `currentTask`. Closes the add task dialog.
----------------------------------------*/
const reset = () => {
    titleInput.value = "";
    dateInput.value = "";
    descriptionInput.value = "";
    priorityInput.value = "";
    addTaskDialog.close();
    currentTask = {};
}

openTaskFormBtn.addEventListener("click", () => 
    taskForm.classList.toggle("hidden")
);

/*--------------------------------------
Fetches tasks from the backend, clears `taskData`, and repopulates it with the fetched data, then updates the task container.
----------------------------------------*/
const loadTasksFromBackend = async () => {
    const response = await fetch('http://localhost:8080/tasks');
    const tasks = await response.json();
    taskData.length = 0; // Clear the array
    taskData.push(...tasks); // Add fetched tasks to `taskData`
    updateTaskContainer(); // Re-render the tasks
};

// Populate the task list
window.addEventListener('DOMContentLoaded', loadTasksFromBackend);

/*--------------------------------------
Upon clicking the "x" button to close the form:
const formInputsContainValues = returns true if any of the input fields have any values
const formInputValuesUpdated = returns true if any of the input values have different values than those that match the current task 
Logic: if it is true that the input fields have values and any of those dont match the current task, show the modal.
        This way, the Cancel and Discard buttons in the modal won't be displayed to the user if they 
        haven't made any changes to the input fields while attempting to edit a task.

----------------------------------------*/
closeTaskFormBtn.addEventListener("click", () => {
    const formInputsContainValues = titleInput.value || dateInput.value || descriptionInput.value || priorityInput.value;
    const formInputValuesUpdated = titleInput.value != currentTask.title || dateInput.value != currentTask.date || descriptionInput.value != currentTask.description || priorityInput.value != currentTask.priority;
    if (formInputsContainValues && formInputValuesUpdated) {
        confirmCloseDialog.showModal();
    } else{
        reset()
    }
});

/*--------------------------------------
Upon clicking the "Close" button in the modal:
Closes the modal
----------------------------------------*/
cancelBtn.addEventListener("click", () => confirmCloseDialog.close());

/*--------------------------------------
Upon clicking the "Discard" button in the modal:
Closes the modal, resets the "Add Task" form
----------------------------------------*/
discardBtn.addEventListener("click", () => {
    confirmCloseDialog.close();
    reset()
});

/*--------------------------------------
Upon clicking the "Submit" button in the form:
Prevents the default function of "submit"
----------------------------------------*/
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addOrUpdateTask();
});
