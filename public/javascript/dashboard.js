'use strict';

const createBoardBtn = document.querySelector('button');
createBoardBtn.addEventListener('click', createBoard);

async function createBoard() {
    const newBoardName = document.querySelector('input').value;
    const data = {
        newBoardName: newBoardName
    };

    alert('entered created board function');
    const response = await fetch('http://localhost:3000/boards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const res = await response.json();
    console.log(res.newBoardId);
}