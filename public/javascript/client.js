'use strict';

let todoItems = document.getElementsByClassName('todo-card');

for (let i = 0; i < todoItems.length; i++) {
    todoItems[i].addEventListener('click', handleClick);
}

function handleClick(e) {
    const todoTag = e.target.closest('.todo-card');
    const todoDescription = todoTag.getElementsByClassName('todo-description')[0].innerText;
    const todoCheckbox = todoTag.querySelector('input[type="checkbox"]');

    if (todoCheckbox.checked) {
        todoTag.getElementsByClassName('todo-description')[0].style.textDecoration = 'line-through';

        const completedTodo = {
            completedTodo: todoDescription
        };

        fetch('http://localhost:3000/', {
            method: 'PUT',
            body: JSON.stringify(completedTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                response.text();
            })
            .catch(err => console.log(err));

    } else {
        todoTag.getElementsByClassName('todo-description')[0].style.textDecoration = 'none';
    }

    const isTrashClicked = e.target.className === 'trash';

    if (isTrashClicked) {
        const deletedTodo = {
            todoDescription: todoDescription
        };
        fetch('http://localhost:3000/', {
            method: 'DELETE',
            body: JSON.stringify(deletedTodo),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        })
            .then(response => {
                window.location = response.url;
                response.text();
            })
            .catch(err => console.log('this is being executed:' + err));
    }

    const isEditClicked = e.target.className === 'edit';

    if (isEditClicked) {

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
                    window.location = response.url;
                    response.text();
                })
                .catch(err => console.log(err));
        });
    }
}