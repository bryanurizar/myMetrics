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

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board', {
                    method: 'PUT',
                    body: JSON.stringify(completedTodo),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                response.text();
                window.location.reload();
            } catch (err) {
                console.log(err);
            }
        })();
    } else {
        todoTag.getElementsByClassName('todo-description')[0].style.textDecoration = 'none';
    }

    const isTrashClicked = e.target.className === 'trash';

    if (isTrashClicked) {
        const deletedTodo = {
            todoDescription: todoDescription
        };

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board', {
                    method: 'DELETE',
                    body: JSON.stringify(deletedTodo),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                await response.text();
                window.location.reload();
            } catch (err) {
                console.log('this is being executed:' + err);
            }
        })();
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

            (async () => {
                try {
                    let response = await fetch('http://localhost:3000/board', {
                        method: 'PUT',
                        body: JSON.stringify(editedTodo),
                        headers: { 'Content-type': 'application/json; charset=UTF-8' }
                    });
                    response.text();
                    window.location.reload();
                } catch (err) {
                    console.log(err);
                }
            })();
        });
    }
}

/*
***
*** Drag and Drop API Implementation
***
*/

// Selects the draggable items (i.e. todo cards)
const draggableCards = document.querySelectorAll('.todo-card');
const dropZone = document.querySelector('.todos');

// Adds the dragged todo card to the dataTransfer object
const handleDragStart = e => {
    console.log(e.target.nodeType); // => 1
    console.log(e.target);
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.dropEffect = 'move';
};

const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDrop = e => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    dropZone.appendChild(document.querySelector(`#${cardId}`));

};

// Adds an event listener to the todo cards
draggableCards.forEach(draggableCard => {
    draggableCard.addEventListener('dragstart', handleDragStart);
});

dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);





















// // This begins by selecting the elements that will be draggable
// const todoCards = document.querySelectorAll('.todo-card');

// // Adds the drag start event listener to each of the todo cards selected above
// todoCards.forEach(todoCard => {
//     todoCard.addEventListener('dragstart', dragstartHandler);
//     todoCard.addEventListener('dragover', dragoverHandler);
//     todoCard.addEventListener('drop', dropHandler);
// });

// // Adds the dragged node to the DataTransfer object which is a property value on the DragEvent
// function dragstartHandler(e) {
//     e.dataTransfer.dropEffect = 'move';
//     e.dataTransfer.setData('application/x-moz-node', e.currentTarget);
// }

// // Specifies the type of drag and prevents the default on the event
// function dragoverHandler(e) {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
// }

// function dropHandler(e) {
//     e.preventDefault();
//     const insertBelowTodo = e.currentTarget;
//     const draggedTodo = e.dataTransfer.getData('text');

//     // console.log(draggedTodo);
//     insertBelowTodo.insertAdjacentHTML('afterend', draggedTodo);
// }

// todoCards.forEach(todoCard => {
//     todoCard.addEventListener('dragend', dragEndHandler);
// });

// // Checks to see if drop was succesfull and if it was, removes the dragged element from the todo list and only keeps the inserted one
// function dragEndHandler(e) {
//     if (e.dataTransfer.dropEffect !== 'none') {
//         e.target.remove();
//     }
// }