'use strict';

let todoItems = document.getElementsByClassName('todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');
    const todoItem = todoTag.getElementsByClassName('todo-description')[0].innerText;

    if (e.target.className === 'trash') {
        const clickedTodo = {
            todoItem: todoItem
        };
        fetch('http://localhost:3000/', {
            method: 'DELETE',
            body: JSON.stringify(clickedTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                response.json();
            })
            .catch(err => console.log(err));
    }

    if (e.target.className === 'edit') {

        const todoInputTag = todoTag.getElementsByClassName('todo-description')[0];
        todoInputTag.setAttribute('contenteditable', true);
        todoInputTag.focus();
        const todoInputTagText = todoInputTag.innerText;

        todoInputTag.addEventListener('blur', e => {
            const editedTodo = {
                originalTodo: todoInputTagText,
                updatedTodo: e.target.innerText
            };

            fetch('http://localhost:3000/', {
                method: 'PUT',
                body: JSON.stringify(editedTodo),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            })
                .then(response => {
                    // window.location = response.url;
                    response.json();
                })
                .catch(err => console.log(err));
        });
    }
}