'use strict';

let todoItems = document.getElementsByClassName('todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');
    const todoDescription = todoTag.getElementsByClassName('todo-description')[0].innerText;
    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.getElementsByClassName('todo-description')[0].style.textDecoration = 'line-through';

        const completedTodo = {
            completedTodo: todoDescription
        };

        fetch('http://localhost:3000/board', {
            method: 'PUT',
            body: JSON.stringify(completedTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                response.text();
            })
            .catch(err => console.log(err));

    } else {
        todoTag.getElementsByClassName('todo-description')[0].style.textDecoration = 'none';
    }

    const isTrashClicked = e.target.className === 'trash';

    if (isTrashClicked) {
        const deletedTodo = {
            todoDescription: todoDescription
        };
        fetch('http://localhost:3000/board', {
            method: 'DELETE',
            body: JSON.stringify(deletedTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                response.text();
            })
            .catch(err => console.log('this is being executed:' + err));
    }

    const isEditClicked = e.target.className === 'edit';

    if (isEditClicked) {

        const todoInputTag = todoTag.getElementsByClassName('todo-description')[0];
        todoInputTag.setAttribute('contenteditable', true);
        todoInputTag.focus();
        const todoInputTagText = todoInputTag.innerText;

        todoInputTag.addEventListener('keypress', e => {
            if (e.key === 'Enter') todoInputTag.removeAttribute('contenteditable');
        });

        todoInputTag.addEventListener('blur', e => {
            const editedTodo = {
                originalTodo: todoInputTagText,
                updatedTodo: e.target.innerText
            };

            fetch('http://localhost:3000/board', {
                method: 'PUT',
                body: JSON.stringify(editedTodo),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            })
                .then(response => {
                    window.location = response.url;
                    response.text();
                })
                .catch(err => console.log(err));
        });
    }
}

// Drag and Drop API implementation

// Begins by selecting the draggable todo cards
const todoCards = document.querySelectorAll('.todo-card');

// Adds the drag start event listener to each of the todo cards above
todoCards.forEach(todoCard => {
    todoCard.addEventListener('dragstart', dragstartHandler);
});

// The below adds the draggable cards to the dataTransfer object which is basically an object
// that stores the data while it is being dragged
function dragstartHandler(e) {
    // Add the target element to the data trasfer object
    e.dataTransfer.setData('text/html', e.target);
}

const todos = document.querySelector('.todos');

todos.addEventListener('dragover', dragoverHandler);
todos.addEventListener('drop', dropHandler);

function dragoverHandler(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function dropHandler(e) {
    const data = e.dataTransfer.getData('text/html');
    e.target.insertAdjacentHTML('afterend', data);
    e.preventDefault();
}