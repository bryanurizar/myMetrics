export function addItemEventListeners() {
    // Add event listeners to checkbox
    const itemCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    itemCheckboxes.forEach((itemCheckbox) => {
        itemCheckbox.addEventListener('click', handleCheckboxClick);
    });

    // Add event listeners to edit icons
    const editIcons = document.querySelectorAll('.edit');
    editIcons.forEach((editIcon) => {
        editIcon.addEventListener('click', handleEditIconClick);
    });

    // Add event listeners to trash icons
    const trashIcons = document.querySelectorAll('.trash');
    trashIcons.forEach((trashIcon) => {
        trashIcon.addEventListener('click', handleTrashIconClick);
    });

    // Add event listener to list name
    const listNames = document.querySelectorAll('.list-name');
    listNames.forEach((listName) => {
        listName.addEventListener('blur', handListNameUpdate);
        listName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
                handListNameUpdate(e);
            }
            return;
        });
    });
}

// Handle function for checkbox click and updating db
export function handleCheckboxClick(e) {
    const nearestItemCard = e.target.closest('.todo-card');
    const completedItem = {
        completedItemId: nearestItemCard.id.slice(5),
    };

    nearestItemCard.remove();
    postedCompletedItem(completedItem);
}

async function postedCompletedItem(item) {
    try {
        const response = await fetch(`/items/${item.id}`, {
            method: 'PATCH',
            body: JSON.stringify(item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });
        response.text();
    } catch (err) {
        console.log(err);
    }
}

// Handle function for edit click and updating db
export function handleEditIconClick(e) {
    const nearestItemCard = e.target.closest('.todo-card');
    const nearestItemCardDescription =
        nearestItemCard.querySelector('.todo-description');

    nearestItemCardDescription.setAttribute('contenteditable', true);
    nearestItemCardDescription.focus();
    window.getSelection().selectAllChildren(nearestItemCardDescription);
    nearestItemCardDescription.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            nearestItemCardDescription.removeAttribute('contenteditable');
        }
    });

    nearestItemCardDescription.addEventListener('blur', (e) => {
        const editedItem = {
            editedItemId: nearestItemCard.id.slice(5),
            updatedItem: e.target.innerText,
        };
        nearestItemCardDescription.setAttribute('contenteditable', false);
        updateEditedItem(editedItem);
    });
}

async function updateEditedItem(item) {
    try {
        const response = await fetch(`/items/${item.id}`, {
            method: 'PATCH',
            body: JSON.stringify(item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });
        await response.text();
    } catch (err) {
        console.log(err);
    }
}

export function handListNameUpdate(e) {
    const listId = e.target.id;
    const listName = e.target.textContent.trim();
    updateListName(listId, listName);
}

async function updateListName(id, name) {
    const list = {
        id: id,
        name: name,
    };

    try {
        const response = await fetch(`/lists/${list.id}`, {
            method: 'PATCH',
            body: JSON.stringify(list),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });
        await response.text();
    } catch (err) {
        console.log(err);
    }
}

// Handle function for trash icon click and updating db
export function handleTrashIconClick(e) {
    const nearestItemCard = e.target.closest('.todo-card');
    const deletedItem = {
        deletedItemId: nearestItemCard.id.slice(5),
    };
    nearestItemCard.remove();
    removeDeletedItem(deletedItem);
}

async function removeDeletedItem(item) {
    try {
        const response = await fetch(`/items/${item.deletedItemId}`, {
            method: 'DELETE',
            body: JSON.stringify(item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });
        await response.text();
    } catch (err) {
        console.log(err);
    }
}
