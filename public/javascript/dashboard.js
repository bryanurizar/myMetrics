'use strict';

const createBoardBtn = document.querySelector('button');
createBoardBtn.addEventListener('click', createBoard);
const boardSection = document.querySelector('#boards');

async function createBoard() {
    const newBoardName = document.querySelector('input').value;
    const data = {
        newBoardName: newBoardName
    };

    const response = await fetch('http://localhost:3000/boards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const res = await response.json();
    document.querySelector('input').value = '';
    renderNewBoard(newBoardName, res.newBoardId);
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

    const response = fetch(`http://localhost:3000/boards/${boardData.boardId}/${boardData.boardName}`, {
        method: 'PATCH',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(boardData)
    });
    return response;
}
