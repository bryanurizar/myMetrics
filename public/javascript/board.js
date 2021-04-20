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
            completedItemId: todoTag.id.slice(5,)
        };
        console.log(completedItem);
        todoTag.remove();

        (async () => {
            try {
                const response = await fetch(`http://localhost:3000/items/${completedItem.id}`, {
                    method: 'PATCH',
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
        const deletedItem = {
            deletedItemId: todoTag.id.slice(5,)
        };

        todoTag.remove();

        (async () => {
            try {
                const response = await fetch(`http://localhost:3000/items/${deletedItem.deletedItemId}`, {
                    method: 'DELETE',
                    body: JSON.stringify(deletedItem),
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
                editedItemId: todoTag.id.slice(5,),
                updatedItem: e.target.innerText
            };

            (async () => {
                try {
                    const response = await fetch(`http://localhost:3000/items/${editedItem.id}`, {
                        method: 'PATCH',
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
const dropZones = document.querySelectorAll('.items');
console.log(dropZones);

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
    const listId = {
        listId: e.target.id
    };

    (async () => {
        try {
            const response = await fetch(`http://localhost:3000/lists/${listId.listId}`, {
                method: 'DELETE',
                body: JSON.stringify(listId),
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
createTargetListBtn.addEventListener('click', handleButtonClick);
const targetItems = [];

function handleButtonClick() {
    const targetButtonsSection = document.querySelector('#target-list');
    const buttonText = targetButtonsSection.innerText;

    if (buttonText === 'Select Target Items') {
        enableTargetItemsSelection(targetButtonsSection);
    } else {
        startStudySession();
    }
}

function enableTargetItemsSelection(buttonName) {
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    buttonName.appendChild(cancelBtn);

    cancelBtn.addEventListener('click', handleCancelBtn);
    createTargetListBtn.innerText = 'Create Study Session';

    const todoCards = document.querySelectorAll('.todo-card');
    todoCards.forEach(todoCard => {
        todoCard.addEventListener('click', handleTodoCardClick);
    });
}

function startStudySession() {
    if (targetItems.length > 0) {
        window.location.href = 'http://localhost:3000/study-time';
        updateIsTargetList(targetItems);
    } else {
        alert('No items have been selected.');
    }
}

async function updateIsTargetList(items) {
    try {
        const response = await fetch('http://localhost:3000/items', {
            method: 'PATCH',
            body: JSON.stringify(items),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        });
        await response.text();
    } catch (err) {
        console.log(err);
    }
}

function handleCancelBtn(e) {
    e.target.remove();
    createTargetListBtn.innerText = 'Select Target Items';
    createTargetListBtn.addEventListener('click', handleButtonClick, { once: true });

    const todoCards = document.querySelectorAll('.todo-card');
    todoCards.forEach(todoCard => {
        todoCard.classList.remove('targeted');

    });
}

function handleTodoCardClick(e) {
    const todoCard = e.target.closest('.todo-card');
    const todoCardId = todoCard.id.substring(5,);
    console.log(todoCard);
    console.log(todoCardId);
    todoCard.classList.toggle('targeted');

    if (targetItems.includes(todoCardId)) {
        const index = targetItems.indexOf(todoCardId);
        targetItems.splice(index, 1);
    } else {
        targetItems.push(todoCardId);
    }
    console.log(targetItems);
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

function addCard(listId, itemName) {
    const url = new URL(window.location.href);
    const boardId = url.pathname.split('/')[2];

    const itemData = {
        listId: listId,
        itemName: itemName,
        boardId: boardId
    };

    (async () => {
        const response = await fetch('http://localhost:3000/items', {
            method: 'POST',
            body: JSON.stringify(itemData),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        });
        const res = await response.json();
        renderCard(itemData.listId, res.itemId, itemData.itemName);
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