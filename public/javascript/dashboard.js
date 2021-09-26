'use strict';

const createBoardBtn = document.querySelector('button');
const createBoardInput = document.querySelector('.create-board');

createBoardBtn.addEventListener('click', () => {
    const newBoardName = document.querySelector('input').value;
    createBoard(newBoardName);
});

createBoardInput.addEventListener('keypress', e => {
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
        newBoardName: boardName
    };

    const response = await fetch('/boards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const res = await response.json();
    document.querySelector('input').value = '';
    renderNewBoard(boardName, res.newBoardId);
}

function renderNewBoard(boardName, boardId) {
    const boardCard = document.createElement('div');
    boardCard.className = 'board-card';
    const newBoardName = document.createElement('a');
    newBoardName.className = 'board-name';
    newBoardName.textContent = boardName;
    newBoardName.href = `/boards/${boardId}/${encodeURI(decodeURI(boardName.toLowerCase()).replace(/ /g, '-'))}`;
    const editTrashDiv = document.createElement('div');
    editTrashDiv.className = 'dashboard-flaticons';
    editTrashDiv.innerHTML = ` 
        <img class="edit" src="img/edit.svg" />
        <img class="trash" src="img/trash.svg" />
        `;
    boardCard.appendChild(editTrashDiv);
    boardCard.appendChild(newBoardName);
    boardSection.appendChild(boardCard);
}

const boardsSection = document.querySelector('#boards');
boardsSection.addEventListener('click', handleEditOrDeleteClick);

function handleEditOrDeleteClick(e) {
    const boardId = e.target.closest('.dashboard-flaticons').nextElementSibling.href.substring(29, 41);
    const boardName = e.target.closest('.dashboard-flaticons').nextElementSibling.href.substring(42,);
    const parentBoard = e.target.closest('.board-card');

    if (e.target.className === 'edit') {
        // TODO: Add name edit functionality 
    } else if (e.target.className === 'trash') {
        parentBoard.remove();
        deleteBoard(boardId, boardName);
    }
}

async function deleteBoard(id, name) {
    const boardData = {
        boardId: id,
        boardName: name
    };

    const response = fetch(`/boards/${boardData.boardId}/${boardData.boardName}`, {
        method: 'PATCH',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(boardData)
    });
    return response;
}
