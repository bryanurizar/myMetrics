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
 *** Drag and Drop API Implementation for Cards
 ***
 */

let draggableCards = document.querySelectorAll('.todo-card');
const dropZones = document.querySelectorAll('.items');

const handleDragStart = (e) => {
    e.stopPropagation();
    draggableCards = document.querySelectorAll('.todo-card');
    Array.from(draggableCards).forEach((draggableCard) => {
        Array.from(draggableCard.children).forEach((draggableCardChild) => {
            draggableCardChild.style.pointerEvents = 'none';
        });
    });

    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.dropEffect = 'move';
    e.target.style.opacity = '0.5';
};

const handleDragOver = (e) => {
    if (e.dataTransfer.types.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e) => {
    if (e.dataTransfer.types.length !== 1) return;
    e.stopPropagation();
    dropZones.forEach((dropZone) => {
        dropZone.style.backgroundColor = '#eaedf0';
    });

    e.target.style.opacity = '';
    e.target.style.border = '';

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
    draggableCard.addEventListener('dragend', handleDragEnd);
    draggableCard.addEventListener('dragenter', handleDragEnter);
    draggableCard.addEventListener('dragleave', handleDragleave);
});

dropZones.forEach((dropZone) => {
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragover', handleDragOver);
});

function handleDragEnter(e) {
    if (e.dataTransfer.types.length !== 1) return;
    e.stopPropagation();
    e.target.style.opacity = '0.5';
    e.target.style.border = '1px dashed';
}

function handleDragEnd(e) {
    if (e.dataTransfer.types.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    Array.from(draggableCards).forEach((draggableCard) => {
        Array.from(draggableCard.children).forEach((draggableCardChild) => {
            draggableCardChild.style.pointerEvents = 'auto';
        });
    });
    e.target.style.cursor = 'pointer';
}

function handleDragleave(e) {
    if (e.dataTransfer.types.length !== 1) return;
    e.stopPropagation();
    e.target.style.opacity = '';
    e.target.style.border = '';
}

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

//Handle move list modal
const moveListDivs = document.querySelectorAll('.move-list > button');
// const select = document.querySelector('#boards');
const selections = document.querySelectorAll('select');
let selectedBoardId;

selections.forEach((selection) => {
    selection.addEventListener('change', () => {
        selectedBoardId = selection.options[selection.selectedIndex].id;
    });
});

moveListDivs.forEach((moveListDiv) => {
    moveListDiv.addEventListener('click', handleMoveListClick);
});

function handleMoveListClick(e) {
    const nearestSelection = e.target.previousElementSibling;

    selectedBoardId === undefined
        ? (selectedBoardId =
              nearestSelection.options[nearestSelection.selectedIndex].id)
        : selectedBoardId;

    const listId = e.target.closest('.move-list').id;

    const removedList = e.target.closest('.todo-list-container');
    moveList(listId, selectedBoardId);
    removedList.remove();
}

async function moveList(listId, boardId) {
    const updatedListData = {
        movedListId: listId,
        movedToBoardId: boardId,
    };

    const response = await fetch(`/lists/${listId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedListData),
        header: { 'Content-Type': 'application/json; charset=UTF-8' },
    });
    return response;
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

async function handleButtonClick() {
    const todoCards = document.querySelectorAll('.todo-card');
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

function enableTargetItemsSelection() {
    const targetListButtons = document.querySelector('.target-list-buttons');
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.className = 'cancel-btn';
    targetListButtons.appendChild(cancelBtn);

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
        isSessionPageVisited: false,
        boardId: boardId,
    };

    await fetch('/focus-session', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(studySessionData),
    });

    window.location.replace(`/focus-session/${studySessionData.sessionID}`);
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
    }
});

function createList(listName) {
    if (listName === '' || listName.length > 30) {
        alert('Please enter a valid list name.');
        return;
    }
    const url = new URL(window.location.href);
    const newListRank =
        Number(
            document.querySelector('.todo-list-container:nth-last-child(2)')
                ?.dataset.rank
        ) + 1 || 1;
    const boardId = url.pathname.split('/')[2];

    const newList = {
        boardId: boardId,
        listName: listName,
        listRank: newListRank,
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
    document.querySelector('.add-list').value = '';
}

function renderList(id, listName) {
    const lastListRank =
        Number(
            document.querySelector('.todo-list-container:nth-last-child(2)')
                ?.dataset.rank
        ) || 0;

    const list = document.createElement('div');
    list.setAttribute('id', id);
    list.classList.add('todo-list-container');
    list.draggable = 'true';
    list.dataset.rank = Number(lastListRank) + 1;

    list.addEventListener('dragstart', handleListDragStart);
    list.addEventListener('drop', handleListDrop);
    list.addEventListener('dragover', handleListDragOver);
    list.addEventListener('dragenter', handleListDragEnter);
    list.addEventListener('dragleave', handleListDragLeave);
    list.addEventListener('dragend', handleListDragEnd);

    const header = document.createElement('div');
    header.classList.add('list-header');
    list.appendChild(header);

    const listTitle = document.createElement('h4');
    listTitle.classList.add('list-name');
    listTitle.contentEditable = true;
    listTitle.innerText = listName;
    listTitle.style.overflow = 'hidden';
    listTitle.spellcheck = 'false';
    header.appendChild(listTitle);

    listTitle.addEventListener('drop', (e) => e.preventDefault());
    listTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    });

    const listModal = document.createElement('h4');
    listModal.id = id;
    listModal.classList.add('list-popup');
    listModal.innerText = '...';
    header.appendChild(listModal);

    (async () => {
        const currentBoardId = window.location.href.split('/')[4];
        const response = await fetch('/boards');
        const boardData = await response.json();

        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.classList.add('modal');
        header.appendChild(modal);

        const modalTitle = document.createElement('h4');
        modalTitle.id = 'modal-title';
        modalTitle.innerHTML = '<span>List Actions</span>';
        modal.appendChild(modalTitle);

        const moveDiv = document.createElement('div');
        moveDiv.id = id;
        moveDiv.classList.add('move-list');
        moveDiv.classList.add('list-modal-item');
        modal.appendChild(moveDiv);

        const moveSpan = document.createElement('span');
        moveSpan.innerHTML = 'Move to.. ';
        moveDiv.appendChild(moveSpan);

        const label = document.createElement('label');
        label.htmlFor = 'board';
        moveDiv.appendChild(label);

        const select = document.createElement('select');
        select.name = 'boards';
        select.id = 'boards';
        moveDiv.appendChild(select);

        boardData
            .filter((board) => board.boardid !== currentBoardId)
            .forEach((board) => {
                const option = document.createElement('option');
                option.id = board.boardid;
                option.value = board.boardname;
                option.innerHTML = board.boardname;
                select.appendChild(option);
            });

        const moveButton = document.createElement('button');
        moveButton.classList.add('move-btn');
        moveButton.innerHTML = 'Move List..';
        moveButton.style.marginLeft = '3.5px';
        moveDiv.appendChild(moveButton);

        select.addEventListener('change', () => {
            selectedBoardId = select.options[select.selectedIndex].id;
        });

        moveButton.addEventListener('click', (e) => {
            handleMoveListClick(e);
        });

        const deleteDiv = document.createElement('p');
        deleteDiv.id = id;
        deleteDiv.classList.add('delete-list');
        deleteDiv.classList.add('list-modal-item');
        deleteDiv.innerHTML = 'Delete List..';
        modal.appendChild(deleteDiv);

        const deleteList = document.querySelector(`#modal-${id}`);
        const deleteListLink = deleteList.querySelector('p');

        deleteListLink.addEventListener('click', handleDeleteListClick);
    })();

    const board = document.querySelector('#board');
    board.insertAdjacentElement('beforeend', list);

    const todosDiv = document.createElement('div');
    todosDiv.id = `todo-list-${id}`;
    todosDiv.classList.add('items');

    list.appendChild(todosDiv);

    const newListInput = document.createElement('textarea');
    newListInput.id = id;
    newListInput.name = 'itemName';
    newListInput.classList.add('add-card');
    newListInput.placeholder = 'Add new card...';
    newListInput.onDrop = 'return false';
    newListInput.maxLength = '255';
    newListInput.addEventListener('input', handleTextareaInput);
    newListInput.addEventListener('blur', handleTextareaBlur);
    newListInput.addEventListener('drop', (e) => e.preventDefault());
    list.appendChild(newListInput);

    const boardSection = document.querySelector('#board');
    const newListElement = document.querySelector('.add-list').parentNode;
    boardSection.insertBefore(list, newListElement);

    boardSection.scrollLeft = 1000000000000000;

    const modalLink = document.querySelector(`[id="${id}"]`);
    modalLink.addEventListener('click', handleModal);

    // Adding event listeners for the drag and drop API
    todosDiv.addEventListener('drop', handleDrop);
    todosDiv.addEventListener('dragover', handleDragOver);
}

document.addEventListener('input', (e) => {
    if (
        e.target.classList.contains('list-name') &&
        e.target.innerText.length > 30
    ) {
        alert('Maximum of 30 characters exceeded');
        e.target.innerText = e.target.innerText.substring(0, 30);
        e.target.blur();
    }
});

newListInput.addEventListener('input', () => {
    newListInput.value.length > 30
        ? newListInput.classList.add('invalid')
        : newListInput.classList.remove('invalid');
});

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
    todoCard.addEventListener('dragenter', handleDragEnter);
    todoCard.addEventListener('dragleave', handleDragleave);
    todoCard.addEventListener('dragover', handleDragOver);
    todoCard.addEventListener('drop', handleDrop);
    todoCard.addEventListener('dragend', handleDragEnd);

    // Adding event listeners to checkbox, edit and trash icons on new element
    const itemCheckbox = todoCard.querySelector('input[type="checkbox"]');
    const itemEditIcon = todoCard.querySelector('.edit');
    const itemTrashIcon = todoCard.querySelector('.trash');

    itemCheckbox.addEventListener('click', handleCheckboxClick);
    itemEditIcon.addEventListener('click', handleEditIconClick);
    itemTrashIcon.addEventListener('click', handleTrashIconClick);
}

document.addEventListener('input', (e) => {
    if (
        e.target.classList.contains('todo-description') &&
        e.target.innerText.length > 255
    ) {
        alert('Maximum of 255 characters exceeded');
        e.target.innerText = e.target.innerText.substring(0, 255);
    }
});

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

//Dynamically increases size of add card text area as user  types and then resets size of textarea
const textarea = document.querySelector('.add-card');

if (textarea) {
    textarea.addEventListener('input', handleTextareaInput);
    textarea.addEventListener('blur', handleTextareaBlur);
}

function handleTextareaInput(e) {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
}

function handleTextareaBlur(e) {
    e.target.value === '' ? e.target.removeAttribute('style') : null;
}

// Add event listener to the board dropdown
const boardName = document.querySelector('.boardname-wrapper');
const dropdownContent = document.querySelector('.dropdown-content');
const dropdownSVG = document.querySelector('svg');
boardName.addEventListener('click', () => {
    dropdownContent.classList.toggle('hidden');
    dropdownSVG.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.boardname-wrapper') === null) {
        dropdownContent.classList.add('hidden');
        dropdownSVG.classList.remove('open');
    }
});

/*
 ***
 *** Drag and Drop for Lists
 ***
 */

// Sets the draggables as the lists
let draggables = document.querySelectorAll('.todo-list-container');

// Add dragstart event listener to the lists above
Array.from(draggables).forEach((draggable) => {
    draggable.addEventListener('dragstart', handleListDragStart);
});

function handleListDragStart(e) {
    draggables = document.querySelectorAll('.todo-list-container');
    Array.from(draggables).forEach((draggable) => {
        Array.from(draggable.children).forEach((draggableChild) => {
            draggableChild.style.pointerEvents = 'none';
        });
    });

    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.setData('listdrag', 'listdrag');
    e.dataTransfer.dropEffect = 'move';
    e.target.style.opacity = '0.5';
}

// Adds the drop event to the lists so that they are valid drop targets
// Adds the dragover event which fires whenever a draggables enters a valid drop target

Array.from(draggables).forEach((draggable) => {
    draggable.addEventListener('drop', handleListDrop);
    draggable.addEventListener('dragover', handleListDragOver);
    draggable.addEventListener('dragenter', handleListDragEnter);
    draggable.addEventListener('dragleave', handleListDragLeave);
    draggable.addEventListener('dragend', handleListDragEnd);
});

function handleListDragEnd(e) {
    Array.from(draggables).forEach((draggable) => {
        Array.from(draggable.children).forEach((draggableChild) => {
            draggableChild.style.pointerEvents = 'auto';
        });
    });
    e.target.style.opacity = '';
    e.target.closest('.todo-list-container').style.border = '';
}

function handleListDragEnter(e) {
    if (e.dataTransfer.types.length === 1) return;
    if (e.target.closest('.todo-list-container')) {
        e.target.closest('.todo-list-container').style.border = '1px dashed';
    }
}

function handleListDragLeave(e) {
    if (e.dataTransfer.types.length === 1) return;
    if (e.target.closest('.todo-list-container')) {
        e.target.closest('.todo-list-container').style.border = '';
    }
}

function handleListDrop(e) {
    e.preventDefault(); // prevents default browser behaviour
    e.target.closest('.todo-list-container').style.border = '';
    const draggedListId = e.dataTransfer.getData('text/plain');
    const draggedList = document.getElementById(draggedListId);
    const draggedListRank = draggedList.dataset.rank;

    const dropZoneList = e.target.closest('.todo-list-container');
    const dropZoneListRank = dropZoneList.dataset.rank;

    if (draggedListRank < dropZoneListRank) {
        draggedList.parentNode.removeChild(draggedList);
        dropZoneList.insertAdjacentElement('afterend', draggedList);
    }

    if (draggedListRank > dropZoneListRank) {
        draggedList.parentNode.removeChild(draggedList);
        dropZoneList.insertAdjacentElement('beforebegin', draggedList);
    }

    const listRankData = {
        draggedListId: draggedListId,
        draggedListRank: draggedListRank,
        dropZoneListId: dropZoneList.id,
        dropZoneListRank: dropZoneListRank,
    };

    (async () => {
        await patchRank(updateListRank(listRankData));
    })();
}

function handleListDragOver(e) {
    e.preventDefault(); // prevents default browser behavior
    e.dataTransfer.dropEffect = 'move';
}

async function patchRank(data) {
    await fetch('/boards', {
        method: 'PATCH',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

function updateListRank(data) {
    const lists = Array.from(document.querySelectorAll('.todo-list-container'));

    if (data.draggedListRank < data.dropZoneListRank) {
        lists.map((list) => {
            if (list.dataset.rank <= data.dropZoneListRank) {
                list.dataset.rank = list.dataset.rank - 1;
            }

            if (list.id === data.draggedListId) {
                list.dataset.rank = data.dropZoneListRank;
            }
        });
    }

    if (data.draggedListRank > data.dropZoneListRank) {
        lists.map((list) => {
            if (list.dataset.rank >= data.dropZoneListRank) {
                list.dataset.rank = Number(list.dataset.rank) + 1;
            }
            if (list.id === data.draggedListId) {
                list.dataset.rank = data.dropZoneListRank;
            }
        });
    }

    const updatedLists = Array.from(
        document.querySelectorAll('.todo-list-container')
    );

    const listRankData = updatedLists.map((updatedList) => {
        return {
            listId: updatedList.id,
            listRank: updatedList.dataset.rank,
        };
    });

    return listRankData;
}
