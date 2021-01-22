'use strict';

let todoItems = document.getElementsByClassName('todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');
    const todoDescription = todoTag.querySelectorAll('.todo-description')[0].innerText;
    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'line-through';

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
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'none';
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

const draggableCards = document.querySelectorAll('.todo-card');
const dropZone = document.querySelector('.todos');

const handleDragStart = e => {
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
    const dropNode = e.target.closest('.todo-card');

    if (isMouseAboveMiddle(e)) {
        dropNode.insertAdjacentElement('beforebegin', document.querySelector(`#${cardId}`));
    } else {
        dropNode.insertAdjacentElement('afterend', document.querySelector(`#${cardId}`));
    }
};

draggableCards.forEach(draggableCard => {
    draggableCard.addEventListener('dragstart', handleDragStart);
});

function isMouseAboveMiddle(e) {
    const bounds = e.target.getBoundingClientRect();
    const y = e.clientY - bounds.top;
    return y < bounds.height / 2;
}

dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragover', handleDragOver);
