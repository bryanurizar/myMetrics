'use strict';
import { edit, trash } from './icons.js';
import {
    addItemEventListeners,
    handleCheckboxClick,
    handleEditIconClick,
    handleTrashIconClick,
} from './itemEventHandlers.js';

// Adds checkbox, edit and trash icon event handlers to items in lists
addItemEventListeners();

/*
 ***
 *** Drag and Drop API Implementation
 ***
 */

const draggableCards = document.querySelectorAll('.todo-card');
const dropZones = document.querySelectorAll('.items');
let draggedCardId;

const handleDragStart = (e) => {
    draggedCardId = e.target.id;
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.dropEffect = 'move';
};

const handleDragOver = (e) => {
    let overCurrentCard;
    let overCurrentCardId;

    const [x, y] = [e.clientX, e.clientY];
    const mouseElement = document.elementFromPoint(x, y);
    const isMouseElementItemsSection = mouseElement.classList.contains('items');
    console.log('is items element', isMouseElementItemsSection);
    let isCurrentItemsSectionEmpty;

    isMouseElementItemsSection
        ? (isCurrentItemsSectionEmpty = mouseElement.firstElementChild === null)
        : null;

    isCurrentItemsSectionEmpty
        ? (mouseElement.style.backgroundColor = '#e3e5e8')
        : null;

    try {
        overCurrentCard = e.target.closest('.todo-card');
        overCurrentCardId = overCurrentCard.id;
    } catch (err) {
        const todoCards = Array.from(document.querySelectorAll('.todo-card'));
        todoCards.forEach((todoCard) => {
            todoCard.style.backgroundColor = 'white';
        });
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return;
    }

    if (overCurrentCardId !== draggedCardId) {
        overCurrentCard.style.backgroundColor = '#f4f5f7';
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e) => {
    e.preventDefault();
    const todoCards = Array.from(document.querySelectorAll('.todo-card'));
    const itemSections = Array.from(document.querySelectorAll('.items'));

    todoCards.forEach((todoCard) => {
        todoCard.style.backgroundColor = 'white';
    });

    itemSections.forEach((itemSection) => {
        itemSection.style.background = '#EAEDF0';
    });

    const cardId = e.dataTransfer.getData('text/plain');
    const dropNode = e.target.closest('.items');
    const dropListId = dropNode.id.substring(10);
    const nearestCard = e.target.closest('.todo-card');
    const movedCardNode = document.querySelector(`#${cardId}`);

    if (!dropNode.firstElementChild) {
        dropNode.appendChild(movedCardNode);
    } else {
        isMouseAboveMiddle(e)
            ? nearestCard.insertAdjacentElement('beforebegin', movedCardNode)
            : nearestCard.insertAdjacentElement('afterend', movedCardNode);
    }

    const movedCardId = movedCardNode.id.substring(5);
    const previousCardId =
        movedCardNode.previousElementSibling?.id.substring(5);
    const nextCardId = movedCardNode.nextElementSibling?.id.substring(5);

    updateRank(movedCardId, previousCardId, nextCardId, dropListId);
};

function isMouseAboveMiddle(e) {
    const bounds = e.target.getBoundingClientRect();
    const y = e.clientY - bounds.top;
    return y < bounds.height / 2;
}

draggableCards.forEach((draggableCard) => {
    draggableCard.addEventListener('dragstart', handleDragStart);
});

dropZones.forEach((dropZone) => {
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragover', handleDragOver);
});

async function updateRank(movedId, previousId, nextId, listId) {
    const rankData = {
        movedCardId: movedId,
        previousCardId: previousId,
        nextCardId: nextId,
        dropListId: listId,
    };

    const response = await fetch(`/items/:${movedId}`, {
        method: 'PATCH',
        body: JSON.stringify(rankData),
        headers: { 'content-type': 'application/json' },
    });
    return response;
}

/*
 ***
 **** List modal that appears when user clicks on the "..."
 ***
 */

document.addEventListener('click', handleModal);

function handleModal(e) {
    if (e.target.classList.contains('list-popup')) {
        const modalId = `#modal-${e.target.id}`;
        const modal = document.querySelector(modalId);
        modal.classList.add('modal-styles');
        modal.classList.remove('modal');
    } else if (
        e.target.closest('.modal-styles') === null &&
        document.querySelector('.modal-styles')
    ) {
        document.querySelectorAll('.modal-styles').forEach((el) => {
            el.classList.add('modal');
            el.classList.remove('modal-styles');
        });
    }
}

const deleteList = document.querySelectorAll('.delete-list');

deleteList.forEach((list) => {
    list.addEventListener('click', handleDeleteListClick);
});

function handleDeleteListClick(e) {
    const listId = {
        listId: e.target.id,
    };

    (async () => {
        try {
            const response = await fetch(`/lists/${listId.listId}`, {
                method: 'DELETE',
                body: JSON.stringify(listId),
                headers: { 'Content-type': 'application/json; charset=UTF-8' },
            });
            await response.text();
            const deletedTodoList = document
                .querySelector(`#todo-list-${e.target.id}`)
                .closest('.todo-list-container');
            deletedTodoList.remove();
        } catch (err) {
            console.log(err);
        }
    })();
}

/*
 ***
 *** Create target list when user clicks the selection button
 ***
 */

const createTargetListBtn = document.querySelector('.create-list');
createTargetListBtn.addEventListener('click', handleButtonClick);
let targetItems = [];
const todoCards = document.querySelectorAll('.todo-card');

async function handleButtonClick() {
    const targetButtonsSection = document.querySelector('#target-list');
    const buttonText = targetButtonsSection.innerText.substring(0, 18);

    if (buttonText === 'Select Focus Items') {
        todoCards.forEach((todoCard) => {
            todoCard.classList.add('no-hover');
        });
        enableTargetItemsSelection(targetButtonsSection);
    } else {
        await checkLengthOfTargetList();
    }
}

function enableTargetItemsSelection(buttonName) {
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.className = 'cancel-btn';
    buttonName.appendChild(cancelBtn);

    cancelBtn.addEventListener('click', handleCancelBtn);
    createTargetListBtn.innerText = 'Create Focus Session';

    const todoCards = document.querySelectorAll('.todo-card');
    todoCards.forEach((todoCard) => {
        todoCard.addEventListener('click', handleTodoCardClick);
    });
}

async function checkLengthOfTargetList() {
    if (targetItems.length > 0) {
        await updateTargetList(targetItems);
    } else {
        alert('No items have been selected.');
    }
}

async function updateTargetList(items) {
    try {
        const response = await fetch('/items', {
            method: 'PATCH',
            body: JSON.stringify(items),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });
        const res = await response.json();
        await postStudySession(res.studySessionId);
        window.location.replace(`/focus-session/${res.studySessionId}`);
    } catch (err) {
        console.log(err);
    }
}

async function postStudySession(studySessionId) {
    const url = new URL(window.location.href);
    const boardId = url.pathname.split('/')[2];

    const studySessionData = {
        sessionID: studySessionId,
        sessionDuration: 0,
        isSessionPageVisited: 'No',
        boardId: boardId,
    };

    const response = await fetch('/focus-session', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(studySessionData),
    });
    return response;
}

function handleCancelBtn(e) {
    targetItems = [];
    e.target.remove();
    createTargetListBtn.innerText = 'Select Focus Items';
    createTargetListBtn.addEventListener('click', handleButtonClick, {
        once: true,
    });

    const todoCards = document.querySelectorAll('.todo-card');
    todoCards.forEach((todoCard) => {
        todoCard.classList.remove('targeted');
        todoCard.classList.remove('no-hover');
        todoCard.removeEventListener('click', handleTodoCardClick);
    });
}

function handleTodoCardClick(e) {
    const todoCard = e.target.closest('.todo-card');
    const todoCardId = todoCard.id.substring(5);
    todoCard.classList.toggle('targeted');
    const targetSessionStorage = window.sessionStorage;

    if (targetItems.includes(todoCardId)) {
        const index = targetItems.indexOf(todoCardId);
        targetItems.splice(index, 1);
        targetSessionStorage.setItem(
            'targetItems',
            JSON.stringify(targetItems)
        );
    } else {
        targetItems.push(todoCardId);
        targetSessionStorage.setItem(
            'targetItems',
            JSON.stringify(targetItems)
        );
    }
}

// Create new list using JavaScript object
const newListInput = document.querySelector('.add-list');
newListInput.addEventListener('drop', (e) => e.preventDefault());

newListInput.addEventListener('keypress', (e) => {
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
        boardId: boardId,
    };

    (async () => {
        try {
            const response = await fetch('/lists', {
                method: 'POST',
                body: JSON.stringify(newList),
                headers: { 'Content-type': 'application/json; charset=UTF-8' },
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

    listTitle.addEventListener('drop', (e) => e.preventDefault());

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
    todosDiv.classList.add('items');

    list.appendChild(todosDiv);

    const newListInput = document.createElement('input');
    newListInput.id = id;
    newListInput.name = 'todoDescription';
    newListInput.classList.add('add-card');
    newListInput.type = 'text';
    newListInput.autoComplete = 'off';
    newListInput.placeholder = 'Add new card...';
    newListInput.addEventListener('drop', (e) => e.preventDefault());
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
    if (itemName === '') return;
    const url = new URL(window.location.href);
    const boardId = url.pathname.split('/')[2];

    const itemData = {
        listId: listId,
        itemName: itemName,
        boardId: boardId,
    };

    (async () => {
        const response = await fetch('/items', {
            method: 'POST',
            body: JSON.stringify(itemData),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
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
            <div class="wrapper">
                <input type="checkbox"/>
                <p class="todo-description">${cardContent}</p>
            </div>
            <div class="list-flaticons">
                <img class="flaticons edit" src=${edit} />
                <img class="flaticons trash" src=${trash} />
            </div>
        </div>
        `;

    list.appendChild(todoCard);

    // Adding event listener for the drag and drop API
    todoCard.addEventListener('dragstart', handleDragStart);

    // Adding event listeners to checkbox, edit and trash icons on new element
    const itemCheckbox = todoCard.querySelector('input[type="checkbox"]');
    const itemEditIcon = todoCard.querySelector('.edit');
    const itemTrashIcon = todoCard.querySelector('.trash');

    itemCheckbox.addEventListener('click', handleCheckboxClick);
    itemEditIcon.addEventListener('click', handleEditIconClick);
    itemTrashIcon.addEventListener('click', handleTrashIconClick);
}

// Added event listener to the input elements of the list by using event delegation
const board = document.querySelector('#board');

board.addEventListener('keypress', (e) => {
    if (e.target.className === 'add-card' && e.key === 'Enter') {
        e.preventDefault();
        const cardContent = e.target.value;
        const listId = e.target.id;
        addCard(listId, cardContent);
        e.target.value = '';
        e.target.removeAttribute('style');
    }
});

// Dynamically increases size of add card text area as user  types
const textarea = document.querySelector('.add-card');

textarea.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
});

// Sets add card textarea back to the original default size on blur
textarea.addEventListener('blur', (e) => {
    e.target.value === '' ? e.target.removeAttribute('style') : null;
});
