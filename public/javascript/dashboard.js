'use strict';

const createBoardBtn = document.querySelector('button');
createBoardBtn.addEventListener('click', createBoard);

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
    renderNewBoard(newBoardName, res.newBoardId);
}

function renderNewBoard(boardName, boardId) {
    const newBoardElement = document.createElement('a');
    newBoardElement.textContent = boardName;
    newBoardElement.href = `/boards/${boardId}/${encodeURI(decodeURI(boardName.toLowerCase()).replace(/ /g, '-'))}`;

    const lineBreak = document.createElement('br');
    const boardList = document.querySelector('#boards');
    boardList.insertAdjacentElement('beforeend', newBoardElement);
    boardList.appendChild(lineBreak);
}

const dashboardAnchorTags = document.querySelector('.dashboard');
dashboardAnchorTags.addEventListener('click', () => {
    const url = new URL(window.location);
    const user = url.pathname.split('/')[1];
    dashboardAnchorTags.href = `${user}/dashboard`;
});