'use strict';

import { edit, trash } from './icons.js';
let todoItems = document.querySelectorAll('.todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');

    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'line-through';

        const completedItem = {
            id: todoTag.id.slice(5,)
        };

        todoTag.remove();

        (async () => {
            try {
                const response = await fetch(`http://localhost:3000/items/${completedItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(completedItem),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                response.text();
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

        todoTag.remove();

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board', {
                    method: 'DELETE',
                    body: JSON.stringify(deletedTodo),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                await response.text();
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
            const editedItem = {
                id: todoTag.id.slice(5,),
                updatedItem: e.target.innerText
            };

            (async () => {
                try {
                    const response = await fetch('http://localhost:3000/board', {
                        method: 'PUT',
                        body: JSON.stringify(editedItem),
                        headers: { 'Content-type': 'application/json; charset=UTF-8' }
                    });
                    await response.text();
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
const dropZones = document.querySelectorAll('.todos');

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

function isMouseAboveMiddle(e) {
    const bounds = e.target.getBoundingClientRect();
    const y = e.clientY - bounds.top;
    return y < bounds.height / 2;
}

draggableCards.forEach(draggableCard => {
    draggableCard.addEventListener('dragstart', handleDragStart);
});

dropZones.forEach(dropZone => {
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragover', handleDragOver);
});

/*
***
**** List modal that appears when user clicks on the "..."
***
*/
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
            await response.text();
            const deletedTodoList = document.querySelector(`#todo-list-${e.target.id}`).closest('.todo-list-container');
            deletedTodoList.remove();
        } catch (err) {
            console.log(err);
        }
    })();
}

/*
***
*** Create target list when user clicks the selectiona button
***
*/

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

            createTargetListBtn.innerText = 'Create Target List';
        }

        console.log(targetTasksArray);

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board/create-target-list', {
                    method: 'PUT',
                    body: JSON.stringify(targetTasksArray),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                await response.text();
            } catch (err) {
                console.log(err);
            }
        })();
    }
}

// Create new list using JavaScript object
const newListInput = document.querySelector('.add-list');

newListInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        createList(newListInput.value);
        newListInput.value = '';
    }
});

function createList(listName) {
    const url = new URL(window.location.href);
    const boardId = url.pathname.split('/')[2];

    const newList = {
        listName: listName,
        boardId: boardId
    };

    console.log(window.location.href);



    (async () => {
        try {
            const response = await fetch('http://localhost:3000/lists', {
                method: 'POST',
                body: JSON.stringify(newList),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });
            const res = await response.json();
            renderList(res.listId, listName);
        } catch (err) {
            console.log(err);
        }
    })();

}

function renderList(id, listName) {
    const list = document.createElement('div');
    list.classList.add('todo-list-container');

    const header = document.createElement('div');
    header.classList.add('list-header');
    list.appendChild(header);

    const listTitle = document.createElement('h4');
    listTitle.classList.add('list-name');
    listTitle.contentEditable = true;
    listTitle.innerText = listName;
    header.appendChild(listTitle);

    const listModal = document.createElement('h4');
    listModal.id = id;
    listModal.classList.add('list-popup');
    listModal.innerText = '...';
    header.appendChild(listModal);

    const modal = document.createElement('div');
    modal.id = `modal-${id}`;
    modal.classList.add('modal');
    modal.innerHTML = `
        <h4 id="modal-title"><span>List Actions</span></h4>	
        <p id="${id}" class="delete-list">Delete This List..</p>
        `;

    header.appendChild(modal);

    const board = document.querySelector('#board');
    board.insertAdjacentElement('beforeend', list);

    const todosDiv = document.createElement('div');
    todosDiv.id = `todo-list-${id}`;
    todosDiv.classList.add('todos');
    list.appendChild(todosDiv);

    const newListInput = document.createElement('input');
    newListInput.id = id;
    newListInput.name = 'todoDescription';
    newListInput.classList.add('add-card');
    newListInput.type = 'text';
    newListInput.autoComplete = 'off';
    newListInput.placeholder = 'Add new card...';
    list.appendChild(newListInput);

    const boardSection = document.querySelector('#board');
    const newListElement = document.querySelector('.add-list').parentNode;
    boardSection.insertBefore(list, newListElement);

    boardSection.scrollLeft = 1000000000000000;

    const modalLink = document.querySelector(`[id="${id}"]`);
    modalLink.addEventListener('click', handleModal);

    const deleteList = document.querySelector(`#modal-${id}`);
    const deleteListLink = deleteList.querySelector('p');

    deleteListLink.addEventListener('click', handleDeleteListClick);

    // Adding event listeners for the drag and drop API
    todosDiv.addEventListener('drop', handleDrop);
    todosDiv.addEventListener('dragover', handleDragOver);
}

function addCard(listId, cardContent) {
    const card = {
        listId: listId,
        content: cardContent
    };

    (async () => {
        const response = await fetch('http://localhost:3000/board/add-item', {
            method: 'POST',
            body: JSON.stringify(card),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        });
        const res = await response.json();
        renderCard(card.listId, res.id, card.content);
    })();
}


function renderCard(listId, cardId, cardContent) {
    const list = document.querySelector(`#todo-list-${listId}`);

    const todoCard = document.createElement('div');
    todoCard.id = `card-${cardId}`;
    todoCard.classList.add('todo-card');
    todoCard.draggable = 'true';
    todoCard.innerHTML = `
        <div class="todo-content" >
           <input type="checkbox"/>
           <p class="todo-description">${cardContent}</p>
           <br />
           <div class="flaticons">
               <img class="edit" src=${edit} />
               <img class="trash" src=${trash} />
           </div>
        </div>
        `;

    list.appendChild(todoCard);

    // Adding event listener for the drag and drop API
    todoCard.addEventListener('dragstart', handleDragStart);
    todoCard.addEventListener('click', handleClick);
}

// Added event listner to the input elements of the list by using event delegation
const board = document.querySelector('#board');

board.addEventListener('keypress', e => {
    if (e.target.className === 'add-card' && e.key === 'Enter') {
        const cardContent = e.target.value;
        const listId = e.target.id;
        addCard(listId, cardContent);
        e.target.value = '';
    }
});