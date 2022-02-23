'use strict';

const createBoardBtn = document.querySelector('.create-btn');
const createBoardInput = document.querySelector('.create-board');

createBoardBtn.addEventListener('click', () => {
    const newBoardName = document.querySelector('.create-board').value;
    createBoard(newBoardName);
});

createBoardInput.addEventListener('input', () => {
    createBoardInput.value.length > 30
        ? createBoardInput.classList.add('invalid')
        : createBoardInput.classList.remove('invalid');
});

createBoardInput.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('create-board') && e.key === 'Enter') {
        const newBoardName = e.target.value;
        createBoard(newBoardName);
    }
});

const boardSection = document.querySelector('#boards');

async function createBoard(boardName) {
    if (boardName === '' || boardName.length > 30) {
        alert('Please enter a valid board name.');
        return;
    }

    const newBoardRank =
        Number(boardSection.lastElementChild?.dataset.rank) + 1 || 1;

    const data = {
        newBoardName: boardName,
        newBoardRank: newBoardRank,
    };

    const response = await fetch('/boards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const res = await response.json();
    document.querySelector('.create-board').value = '';
    renderNewBoard(boardName, res.newBoardId);
}

function renderNewBoard(boardName, boardId) {
    const lastBoardCardRank =
        document.querySelector('#boards').lastElementChild?.dataset.rank || 0;

    const boardCard = document.createElement('div');
    boardCard.id = boardId;
    boardCard.classList.add('board-card');
    boardCard.classList.add('drop');
    boardCard.draggable = true;
    boardCard.dataset.rank = Number(lastBoardCardRank) + 1;

    const newBoardName = document.createElement('div');
    newBoardName.className = 'board-name';
    newBoardName.id = boardId;
    newBoardName.innerText = boardName;
    boardCard.appendChild(newBoardName);
    newBoardName.addEventListener('click', handleBoardNavigation);

    const editTrashDiv = document.createElement('div');
    editTrashDiv.className = 'dashboard-flaticons';
    editTrashDiv.innerHTML = ` 
        <img class="flaticons edit" src="img/edit.svg" />
        <img class="flaticons trash" src="img/trash.svg" />
        `;
    editTrashDiv.addEventListener('click', handleEditOrDeleteClick);
    boardCard.appendChild(editTrashDiv);
    boardCard.appendChild(newBoardName);
    boardSection.appendChild(boardCard);
}

const boardsSectionFlaticons = Array.from(
    document.querySelectorAll('.dashboard-flaticons')
);

boardsSectionFlaticons.forEach((boardSelectionFlaticon) => {
    boardSelectionFlaticon.addEventListener('click', handleEditOrDeleteClick);
});

function handleEditOrDeleteClick(e) {
    const boardId = e.target.parentNode.nextElementSibling.id;
    const boardName = e.target.parentNode.nextElementSibling.innerText;
    const boardElement = e.target.parentNode.nextElementSibling;
    const parentBoard = e.target.closest('.board-card');

    if (e.target.classList.contains('edit')) {
        boardElement.setAttribute('contenteditable', true);
        boardElement.style.cursor = 'auto';
        boardElement.removeEventListener('click', handleBoardNavigation);
        boardElement.focus();
        window.getSelection().selectAllChildren(boardElement);

        boardElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                boardElement.removeAttribute('contenteditable', false);
                boardElement.addEventListener('click', handleBoardNavigation);
                window.getSelection().empty();
            }
        });

        boardElement.addEventListener('blur', (e) => {
            const editedBoard = {
                editedBoardId: boardId,
                updatedBoard: e.target.innerText,
            };

            boardElement.setAttribute('contenteditable', false);
            boardElement.style.cursor = 'pointer';
            boardElement.addEventListener('click', handleBoardNavigation);
            editBoard(editedBoard.editedBoardId, editedBoard.updatedBoard);
        });
    } else if (e.target.classList.contains('trash')) {
        parentBoard.remove();
        deleteBoard(boardId, boardName);
    }
}

// Prevent more than 30 chars for board name
document.addEventListener('input', (e) => {
    if (
        e.target.classList.contains('board-name') &&
        e.target.innerText.length > 30
    ) {
        alert('Maximum of 30 characters exceeded');
        e.target.innerText = e.target.innerText.substring(0, 30);
    }
});

// Event listeners on boards
const boardNameDivs = Array.from(document.querySelectorAll('.board-name'));

boardNameDivs.forEach((boardNameDiv) => {
    boardNameDiv.addEventListener('click', handleBoardNavigation);
});

function handleBoardNavigation(e) {
    window.location.href = `/boards/${e.target.id}/${e.target.innerText}`;
}

async function deleteBoard(id, name) {
    const boardData = {
        boardId: id,
        boardName: name,
    };

    const response = fetch(
        `/boards/${boardData.boardId}/${boardData.boardName}`,
        {
            method: 'PATCH',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(boardData),
        }
    );
    return response;
}

async function editBoard(id, name) {
    const boardData = {
        boardId: id,
        updatedBoardName: name,
    };

    const response = fetch(
        `/boards/${boardData.boardId}/${boardData.updatedBoardName}`,
        {
            method: 'PATCH',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(boardData),
        }
    );
    return response;
}

// Drag and Drop implementation for boards
let draggedBoardCard;
let dropBoards = document.querySelectorAll('.drop');

function handleStart(e) {
    draggedBoardCard = e.target;
    draggedBoardCard.style.opacity = '0.5';

    Array.from(dropBoards).forEach((dropBoard) => {
        Array.from(dropBoard.children).forEach((dropBoardChild) => {
            dropBoardChild.style.pointerEvents = 'none';
        });
    });

    e.dataTransfer.effectAllowed = 'move';
}

function handleEnter(e) {
    if (e.target.closest('.drop')) {
        e.target.closest('.drop').style.border = '1px dashed';
    }
}
function handleLeave(e) {
    if (e.target.closest('.drop')) {
        e.target.closest('.drop').style.border = '';
    }
}

function handleEnd() {
    // dropBoards = document.querySelectorAll('.drop');
    Array.from(dropBoards).forEach((dropBoard) => {
        Array.from(dropBoard.children).forEach((dropBoardChild) => {
            dropBoardChild.style.pointerEvents = 'auto';
        });
    });
    draggedBoardCard.style.opacity = '';
}

function handleDrop(e) {
    e.preventDefault();
    e.target.style.border = '';

    const closestDropBoard = e.target.closest('.drop');
    const draggedBoardRank = draggedBoardCard.dataset.rank;
    const closestDropBoardRank = closestDropBoard.dataset.rank;

    if (draggedBoardRank < closestDropBoardRank) {
        draggedBoardCard.parentNode.removeChild(draggedBoardCard);
        closestDropBoard.insertAdjacentElement('afterend', draggedBoardCard);
    }

    if (draggedBoardRank > closestDropBoardRank) {
        draggedBoardCard.parentNode.removeChild(draggedBoardCard);
        closestDropBoard.insertAdjacentElement('beforebegin', draggedBoardCard);
    }

    const boardRankData = {
        draggedBoardId: draggedBoardCard.id,
        draggedBoardRank: draggedBoardRank,
        dropBoardId: closestDropBoard.id,
        dropBoardRank: closestDropBoardRank,
    };

    (async () => {
        await patchRank(updateRank(boardRankData));
    })();
}

function handleOver(e) {
    e.preventDefault();
}

document.addEventListener('dragstart', handleStart);
document.addEventListener('dragenter', handleEnter);
document.addEventListener('dragleave', handleLeave);
document.addEventListener('dragend', handleEnd);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragover', handleOver);

async function patchRank(data) {
    await fetch('/dashboard', {
        method: 'PATCH',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

function updateRank(data) {
    const boards = Array.from(document.querySelectorAll('.board-card'));

    if (data.draggedBoardRank < data.dropBoardRank) {
        boards.map((board) => {
            if (board.dataset.rank <= data.dropBoardRank) {
                board.dataset.rank = board.dataset.rank - 1;
            }

            if (board.id === data.draggedBoardId) {
                board.dataset.rank = data.dropBoardRank;
            }
        });
    }

    if (data.draggedBoardRank > data.dropBoardRank) {
        boards.map((board) => {
            if (board.dataset.rank >= data.dropBoardRank) {
                board.dataset.rank = Number(board.dataset.rank) + 1;
            }
            if (board.id === data.draggedBoardId) {
                board.dataset.rank = data.dropBoardRank;
            }
        });
    }

    const updatedBoards = Array.from(document.querySelectorAll('.board-card'));

    const boardRankData = updatedBoards.map((updatedBoard) => {
        return {
            boardId: updatedBoard.id,
            boardRank: updatedBoard.dataset.rank,
        };
    });

    return boardRankData;
}
