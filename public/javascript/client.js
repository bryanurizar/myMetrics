'use strict';

let todoItems = document.querySelectorAll('.todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');

    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'line-through';

        const completedTodo = {
            compltedTodoId: todoTag.id.slice(5,)
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
            id: todoTag.id.slice(5,)
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
                console.log(err);
            }
        })();
    }

    const isEditClicked = e.target.className === 'edit';

    if (isEditClicked) {
        const todoTag = e.target.closest('.todo-card');

        const todoInputTag = todoTag.getElementsByClassName('todo-description')[0];
        todoInputTag.setAttribute('contenteditable', true);
        todoInputTag.focus();

        todoInputTag.addEventListener('keypress', e => {
            if (e.key === 'Enter') todoInputTag.removeAttribute('contenteditable');
        });

        todoInputTag.addEventListener('blur', e => {
            const editedTodo = {
                editedTodoId: todoTag.id.slice(5,),
                updatedTodo: e.target.innerText
            };

            (async () => {
                try {
                    const response = await fetch('http://localhost:3000/board', {
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

// Add new list functionality
const newListElement = document.querySelector('.add-list');
newListElement.addEventListener('click', handleNewList);

function handleNewList() {

}

function handleModal(e) {
    const modalId = `#modal-${e.target.id}`;
    const modal = document.querySelector(modalId);

    if (modal.classList.contains('modal-styles')) {
        modal.classList.remove('modal-styles');
        modal.classList.add('modal');
    } else {
        modal.classList.add('modal-styles');
        modal.classList.remove('modal');
    }
}

const modalLinks = document.querySelectorAll('.list-popup');

modalLinks.forEach(modalLink => {
    modalLink.addEventListener('click', handleModal);
});

const deleteList = document.querySelectorAll('.delete-list');

deleteList.forEach(list => {
    list.addEventListener('click', handleDeleteListClick);
});

function handleDeleteListClick(e) {
    const todoListId = {
        id: e.target.id
    };

    (async () => {
        try {
            const response = await fetch('http://localhost:3000/board/delete-list', {
                method: 'POST',
                body: JSON.stringify(todoListId),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });
            response.text();
            window.location.reload();
        } catch (err) {
            console.log(err);
        }
    })();
}

const createTargetListBtn = document.querySelector('#create-list-btn');
createTargetListBtn.addEventListener('click', handleCreateTargetListClick);
const targetTasksArray = [];

function handleCreateTargetListClick() {

    const todoCards = document.querySelectorAll('.todo-card');

    todoCards.forEach(todoCard => {
        todoCard.addEventListener('click', handleTodoCardClick);
    });

    function handleTodoCardClick(e) {
        const todoCard = e.target.closest('.todo-card');
        const todoCardId = Number(todoCard.id.substring(5,));
        todoCard.classList.toggle('targeted');

        if (targetTasksArray.includes(todoCardId)) {
            const index = targetTasksArray.indexOf(todoCardId);
            targetTasksArray.splice(index, 1);
        } else {
            targetTasksArray.push(todoCardId);
        }

        if (document.querySelectorAll('.targeted').length === 0) {
            createTargetListBtn.innerText = 'Select Tasks to Target';
        } else {
            const buttonTag = document.querySelector('#create-list-btn');

            const hours = document.createElement('INPUT');
            hours.setAttribute('type', 'text');
            buttonTag.insertAdjacentElement('beforebegin', hours);

            const minutes = document.createElement('INPUT');
            minutes.setAttribute('type', 'text');
            buttonTag.insertAdjacentElement('beforebegin', minutes);
            createTargetListBtn.innerText = 'Start Timer';
        }

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board/create-target-list', {
                    method: 'PUT',
                    body: JSON.stringify(targetTasksArray),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                response.text();
            } catch (err) {
                console.log(err);
            }
        })();
    }
}

// test of backend api to get todos - I need to rewrite the frontend to not use EJS templating to render all the todo lists. These should probably be a class which can then render the lists using vanilla JavaScript!
(async () => {
    const response = await fetch('http://localhost:3000/getTodos');
    const todos = await response.text();
    console.log(todos);

})();

class List {
    constructor() {
        // What do I really want here?
        // Perhaps it should have a render method so that it will render the HTML dynamically
        // It should allow for arguments which will be the items created from the ListItme class
    }
    render() {
        const list = document.createElement('div');
        list.classList.add('todo-list-container');
        list.innerHTML = document.createElement('div');



        const board = document.querySelector('#board');

        board.insertAdjacentElement('afterbegin', list);

    }
}

const list = new List();
list.render();



class ListItem {
    constructor() {
        // What do I really want here?
    }
    render() { }
}
