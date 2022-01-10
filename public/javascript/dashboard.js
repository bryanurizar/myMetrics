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
    boardCard.className = 'board-card';

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

const boardsSection = document.querySelector('#boards');
boardsSection.addEventListener('click', handleEditOrDeleteClick);

function handleEditOrDeleteClick(e) {
    const boardId = e.target
        .closest('.dashboard-flaticons')
        .nextElementSibling.href.substring(29, 41);

    const boardName = e.target
        .closest('.dashboard-flaticons')
        .nextElementSibling.href.substring(42);

    const boardElement = e.target.closest('.dashboard-flaticons')
        .nextElementSibling.firstElementChild;

    const parentBoard = e.target.closest('.board-card');

    if (e.target.classList.contains('edit')) {
        boardElement.setAttribute('contenteditable', true);
        boardElement.focus();
        window.getSelection().selectAllChildren(boardElement);

        boardElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                boardElement.removeAttribute('contenteditable', false);
                window.getSelection().empty();
            }
        });

        boardElement.addEventListener('blur', (e) => {
            const editedBoard = {
                editedBoardId: boardId,
                updatedBoard: e.target.innerText,
            };

            boardElement.setAttribute('contenteditable', false);

            editBoard(editedBoard.editedBoardId, editedBoard.updatedBoard);
        });
    } else if (e.target.classList.contains('trash')) {
        parentBoard.remove();
        deleteBoard(boardId, boardName);
    }
}

// Below limits the board names to 45 characters
const boardDiv = document.querySelector('.board-name > div');

boardDiv.addEventListener('keypress', () => {
    if (boardDiv.innerText.length >= 45) {
        alert('Maximum of 30 characters exceeded');
        boardDiv.innerText = boardDiv.innerText.substring(0, 44);
    }
});

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
