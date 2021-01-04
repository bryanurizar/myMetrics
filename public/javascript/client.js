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

/*
***
*** Drag and Drop API Implementation
***
*/

// This begins by selecting the elements that will be draggable
const todoCards = document.querySelectorAll('.todo-card');

// Adds the drag start event listener to each of the todo cards selected above
todoCards.forEach(todoCard => {
    todoCard.addEventListener('dragstart', dragstartHandler);
});

// Adds the dragged node to the DataTransfer object which is a property on the DragEvent
function dragstartHandler(e) {
    e.stopPropagation();
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

// Sets the drop zone where draggable elements can be dropped
const todosDropZone = document.querySelectorAll('.todo-card');

// The drop zone must have a dragover and drop event handler
todosDropZone.forEach(todo => {
    todo.addEventListener('dragover', dragoverHandler);
    todo.addEventListener('drop', dropHandler);
});

// Specifies the type of the drag and prevents the default on the event
function dragoverHandler(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// you need to obtain the data from the DataTransfer object and then
// do something to it by using the e.target element (i.e. element that
// you over hovering over for example))
function dropHandler(e) {
    e.preventDefault();
    const insertBelowTodo = e.currentTarget;
    const draggedTodo = e.dataTransfer.getData('text/html');

    insertBelowTodo.insertAdjacentHTML('afterend', draggedTodo);
}

todoCards.forEach(todoCard => {
    todoCard.addEventListener('dragend', dragEndHandler);
});

function dragEndHandler(e) {
    if (e.dataTransfer.dropEffect !== 'none') {
        e.target.remove();
    }
}