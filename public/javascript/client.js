'use strict';

// test of backend api to get todos - I need to rewrite the frontend to not use EJS templating to render all the todo lists. These should probably be a class which can then render the lists using vanilla JavaScript!
(async () => {
    const response = await fetch('http://localhost:3000/getTodos');
    const todos = await response.text();
})();

class List {
    constructor(id, listName, ...listItems) {
        this.id = id;
        this.listName = listName;
        this.todos = [...listItems];
    }

    render() {
        const list = document.createElement('div');
        list.classList.add('todo-list-container');

        const header = document.createElement('div');
        header.classList.add('list-header');
        list.appendChild(header);

        const listTitle = document.createElement('h4');
        listTitle.classList.add('list-name');
        listTitle.contentEditable = true;
        listTitle.innerText = this.listName;
        header.appendChild(listTitle);

        const listModal = document.createElement('h4');
        listModal.id = this.id;
        listModal.classList.add('list-popup');
        listModal.innerText = '...';
        header.appendChild(listModal);

        const modal = document.createElement('div');
        modal.innerHTML =
            `<div id="modal-${this.id}" class="modal">
                <h4 id="modal-title"><span>List Actions</span></h4>
                <p id="${this.id}" class="delete-list">Delete This List..</p>
            </div>`;
        header.appendChild(modal);

        const board = document.querySelector('#board');
        board.insertAdjacentElement('beforeend', list);

        const todosDiv = document.createElement('div');
        todosDiv.id = `todo-list-${this.id}`;
        todosDiv.classList.add('todos');
        list.appendChild(todosDiv);

        for (let i = 0; i < this.todos.length; i++) {

            const todoCard = document.createElement('div');
            todoCard.id = `card-${this.todos[i].todoID}`;
            todoCard.classList.add('todo-card');
            todoCard.draggable = true;

            const todoCardContent = document.createElement('div');
            todoCardContent.classList.add('todo-content');
            todoCardContent.innerHTML =
                `<input type="checkbox" />
                 <p class="todo-description">${this.todos[i].todoDescription}</p>
                 <div class="flaticons">
                    <img class="edit" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuY29tL3N2Z2pzIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDM4My45NDcgMzgzLjk0NyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgY2xhc3M9IiI+PGc+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cgk8Zz4KCQk8Zz4KCQkJPHBvbHlnb24gcG9pbnRzPSIwLDMwMy45NDcgMCwzODMuOTQ3IDgwLDM4My45NDcgMzE2LjA1MywxNDcuODkzIDIzNi4wNTMsNjcuODkzICAgICIgZmlsbD0iIzYyNjI2MiIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgc3R5bGU9IiI+PC9wb2x5Z29uPgoJCQk8cGF0aCBkPSJNMzc3LjcwNyw1Ni4wNTNMMzI3Ljg5Myw2LjI0Yy04LjMyLTguMzItMjEuODY3LTguMzItMzAuMTg3LDBsLTM5LjA0LDM5LjA0bDgwLDgwbDM5LjA0LTM5LjA0ICAgICBDMzg2LjAyNyw3Ny45MiwzODYuMDI3LDY0LjM3MywzNzcuNzA3LDU2LjA1M3oiIGZpbGw9IiM2MjYyNjIiIGRhdGEtb3JpZ2luYWw9IiMwMDAwMDAiIHN0eWxlPSIiPjwvcGF0aD4KCQk8L2c+Cgk8L2c+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPC9nPjwvc3ZnPg==" /> 
                    <img class="trash" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuY29tL3N2Z2pzIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDM4NCAzODQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPGc+CgkJCTxwYXRoIGQ9Ik02NCwzNDEuMzMzQzY0LDM2NC45MDcsODMuMDkzLDM4NCwxMDYuNjY3LDM4NGgxNzAuNjY3QzMwMC45MDcsMzg0LDMyMCwzNjQuOTA3LDMyMCwzNDEuMzMzdi0yNTZINjRWMzQxLjMzM3oiIGZpbGw9IiM2MjYyNjIiIGRhdGEtb3JpZ2luYWw9IiMwMDAwMDAiIHN0eWxlPSIiIGNsYXNzPSIiPjwvcGF0aD4KCQkJPHBvbHlnb24gcG9pbnRzPSIyNjYuNjY3LDIxLjMzMyAyNDUuMzMzLDAgMTM4LjY2NywwIDExNy4zMzMsMjEuMzMzIDQyLjY2NywyMS4zMzMgNDIuNjY3LDY0IDM0MS4zMzMsNjQgMzQxLjMzMywyMS4zMzMgICAgIiBmaWxsPSIjNjI2MjYyIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBzdHlsZT0iIiBjbGFzcz0iIj48L3BvbHlnb24+CgkJPC9nPgoJPC9nPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjwvZz48L3N2Zz4=" />
                 </div>`;

            console.log(this.todos[i].todoDescription);

            todoCard.insertAdjacentElement('afterbegin', todoCardContent);
            todosDiv.insertAdjacentElement('afterbegin', todoCard);
        }

    }
}

const list1 = new List(1, 'UI/UX Features',
    {
        todoID: 261,
        todoDescription: 'Improve the modal functionality (i.e. only allow one modal and if user clicks outside of modal, close modal)',
        isTodoCompleted: 0,
        isOnTargetList: 0,
        createdAt: '2021-02-02T02:36:16.000Z',
        updatedAt: '2021-02-02T02:36:16.000Z',
        userID: null,
        todoListID: 21
    },
    {
        todoID: 262,
        todoDescription: 'Improve click events so that they are more independent from each other',
        isTodoCompleted: 0,
        isOnTargetList: 0,
        createdAt: '2021-02-02T02:36:28.000Z',
        updatedAt: '2021-02-02T02:36:28.000Z',
        userID: null,
        todoListID: 21
    });

list1.render();

const list2 = new List(2, 'Reading List', 'hello');
list2.render();

// class ListItem {
//     constructor(listId, itemId, itemDescription) {
//         this.listId = listId;
//         this.itemId = itemId;
//         this.itemDescription = itemDescription;
//     }
// }

let todoItems = document.querySelectorAll('.todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');

    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'line-through';

        const completedTodo = {
            compltedTodoId: todoTag.id.slice(5,)
        };

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board', {
                    method: 'PUT',
                    body: JSON.stringify(completedTodo),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                response.text();
                window.location.reload();
            } catch (err) {
                console.log(err);
            }
        })();
    } else {
        todoTag.querySelectorAll('.todo-description')[0].style.textDecoration = 'none';
    }

    const isTrashClicked = e.target.className === 'trash';

    if (isTrashClicked) {
        const deletedTodo = {
            id: todoTag.id.slice(5,)
        };

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board', {
                    method: 'DELETE',
                    body: JSON.stringify(deletedTodo),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                await response.text();
                window.location.reload();
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
            const editedTodo = {
                editedTodoId: todoTag.id.slice(5,),
                updatedTodo: e.target.innerText
            };

            (async () => {
                try {
                    const response = await fetch('http://localhost:3000/board', {
                        method: 'PUT',
                        body: JSON.stringify(editedTodo),
                        headers: { 'Content-type': 'application/json; charset=UTF-8' }
                    });
                    response.text();
                    window.location.reload();
                } catch (err) {
                    console.log(err);
                }
            })();
        });
    }
}

// /*
// ***
// *** Drag and Drop API Implementation
// ***
// */

// const draggableCards = document.querySelectorAll('.todo-card');
// const dropZone = document.querySelector('.todos');

// const handleDragStart = e => {
//     e.dataTransfer.setData('text/plain', e.target.id);
//     e.dataTransfer.dropEffect = 'move';
// };

// const handleDragOver = e => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
// };

// const handleDrop = e => {
//     e.preventDefault();
//     const cardId = e.dataTransfer.getData('text/plain');
//     const dropNode = e.target.closest('.todo-card');

//     if (isMouseAboveMiddle(e)) {
//         dropNode.insertAdjacentElement('beforebegin', document.querySelector(`#${cardId}`));
//     } else {
//         dropNode.insertAdjacentElement('afterend', document.querySelector(`#${cardId}`));
//     }
// };

// draggableCards.forEach(draggableCard => {
//     draggableCard.addEventListener('dragstart', handleDragStart);
// });

// function isMouseAboveMiddle(e) {
//     const bounds = e.target.getBoundingClientRect();
//     const y = e.clientY - bounds.top;
//     return y < bounds.height / 2;
// }

// dropZone.addEventListener('drop', handleDrop);
// dropZone.addEventListener('dragover', handleDragOver);

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
    const todoListId = {
        id: e.target.id
    };

    (async () => {
        try {
            const response = await fetch('http://localhost:3000/board/delete-list', {
                method: 'POST',
                body: JSON.stringify(todoListId),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });
            response.text();
            window.location.reload();
        } catch (err) {
            console.log(err);
        }
    })();
}

const createTargetListBtn = document.querySelector('#create-list-btn');
createTargetListBtn.addEventListener('click', handleCreateTargetListClick);
const targetTasksArray = [];

function handleCreateTargetListClick() {

    const todoCards = document.querySelectorAll('.todo-card');

    todoCards.forEach(todoCard => {
        todoCard.addEventListener('click', handleTodoCardClick);
    });

    function handleTodoCardClick(e) {
        const todoCard = e.target.closest('.todo-card');
        const todoCardId = Number(todoCard.id.substring(5,));
        todoCard.classList.toggle('targeted');

        if (targetTasksArray.includes(todoCardId)) {
            const index = targetTasksArray.indexOf(todoCardId);
            targetTasksArray.splice(index, 1);
        } else {
            targetTasksArray.push(todoCardId);
        }

        if (document.querySelectorAll('.targeted').length === 0) {
            createTargetListBtn.innerText = 'Select Tasks to Target';
        } else {
            const buttonTag = document.querySelector('#create-list-btn');

            const hours = document.createElement('INPUT');
            hours.setAttribute('type', 'text');
            buttonTag.insertAdjacentElement('beforebegin', hours);

            const minutes = document.createElement('INPUT');
            minutes.setAttribute('type', 'text');
            buttonTag.insertAdjacentElement('beforebegin', minutes);
            createTargetListBtn.innerText = 'Start Timer';
        }

        (async () => {
            try {
                const response = await fetch('http://localhost:3000/board/create-target-list', {
                    method: 'PUT',
                    body: JSON.stringify(targetTasksArray),
                    headers: { 'Content-type': 'application/json; charset=UTF-8' }
                });
                response.text();
            } catch (err) {
                console.log(err);
            }
        })();
    }
}

