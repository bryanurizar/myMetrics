'use strict';

let todoItems = document.getElementsByClassName('todo-item');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-item');
    const todoItem = todoTag.getElementsByClassName('todo')[0].innerText;

    if (e.target.className === 'trash') {
        const clickeTodo = {
            todoItem: todoItem
        };
        fetch('http://localhost:3000/', {
            method: 'DELETE',
            body: JSON.stringify(clickeTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                return response.json();
            })
            .catch(err => console.log(err));
    }

    if (e.target.className === 'edit') {

        const todoInputTag = todoTag.getElementsByClassName('todo')[0];
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
                    return response.json();
                })
                .catch(err => console.log(err));
        });
    }
}