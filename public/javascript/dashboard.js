'use strict';

const createBoardBtn = document.querySelector('.create-btn');
const createBoardInput = document.querySelector('.create-board');

createBoardBtn.addEventListener('click', () => {
    const newBoardName = document.querySelector('.create-board').value;
    createBoard(newBoardName);
});

createBoardInput.addEventListener('keypress', (e) => {
    if (e.target.className === 'create-board' && e.key === 'Enter') {
        const newBoardName = e.target.value;
        createBoard(newBoardName);
    }
});

const boardSection = document.querySelector('#boards');

async function createBoard(boardName) {
    if (boardName === '') {
        alert('Please enter a valid board name');
        return;
    }

    const data = {
        newBoardName: boardName,
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
    const boardCard = document.createElement('div');
    boardCard.id = boardId;
    boardCard.classList.add('board-card');
    boardCard.classList.add('drop');
    boardCard.draggable = true;

    const newBoardName = document.createElement('a');
    newBoardName.className = 'board-name';
    newBoardName.href = `/boards/${boardId}/${encodeURI(
        decodeURI(boardName.toLowerCase()).replace(/ /g, '-')
    )}`;
    const boardDiv = document.createElement('div');
    boardDiv.innerText = boardName;
    newBoardName.appendChild(boardDiv);

    const editTrashDiv = document.createElement('div');
    editTrashDiv.className = 'dashboard-flaticons';
    editTrashDiv.innerHTML = ` 
        <img class="flaticons edit" src="img/edit.svg" />
        <img class="flaticons trash" src="img/trash.svg" />
        `;
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

// Below limits the board names to 45 characters
const boardElements = Array.from(document.querySelectorAll('.board-name'));

boardElements.forEach((boardElement) => {
    boardElement.addEventListener('keypress', () => {
        if (boardElement.innerText.length >= 45) {
            alert('Maximum of 30 characters exceeded');
            boardElement.innerText = boardElement.innerText.substring(0, 44);
        }
    });
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
const dropBoards = document.querySelectorAll('.drop');

document.addEventListener('dragstart', (e) => {
    draggedBoardCard = e.target;
    draggedBoardCard.opacity = '0.5';

    Array.from(dropBoards).forEach((dropBoard) => {
        Array.from(dropBoard.children).forEach((dropBoardChild) => {
            dropBoardChild.style.pointerEvents = 'none';
        });
    });

    e.dataTransfer.effectAllowed = 'move';
});

document.addEventListener('dragenter', (e) => {
    if (e.target.closest('.drop')) {
        e.target.closest('.drop').style.border = '1px dashed';
    }
});

document.addEventListener('dragleave', (e) => {
    if (e.target.closest('.drop')) {
        e.target.closest('.drop').style.border = '';
    }
});

document.addEventListener('dragend', () => {
    Array.from(dropBoards).forEach((dropBoard) => {
        Array.from(dropBoard.children).forEach((dropBoardChild) => {
            dropBoardChild.style.pointerEvents = 'auto';
        });
    });
    draggedBoardCard.style.opacity = '';
});

document.addEventListener('drop', (e) => {
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
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

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
