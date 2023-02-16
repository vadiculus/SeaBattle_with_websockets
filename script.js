window.addEventListener('DOMContentLoaded', ()=>{
    const positions_y = document.querySelectorAll('.positions_y')[0];
    const positions_y2 = document.querySelectorAll('.positions_y')[1];
    const gameBoard = document.getElementById('my_board');
    const enemyBoard = document.getElementById('enemy_board');
    const count_box = document.getElementById('count_box');
    const start_btn = document.getElementById('start');
    const error_div = document.getElementById('error');
    const key_code_input = document.getElementById('key_code');
    const turn_text = document.getElementById('turn_text');
    let my_turn = false;
    const client = new WebSocket('ws://localhost:8001');
    let can_remake_board = true
    let max_box = 20;
    let removeErrorsDataTimeout;

    function setErrorData(message){
        error_div.innerText = message;
        removeErrorsDataTimeout = setTimeout(()=>{
            error_div.innerText = '';
        }, 5000);
    };

    key_code_input.addEventListener('keydown', (event) => {
        if (event.which === 13){
            console.log('bebra')
            message = {
                action: 'join',
                key_room: key_code_input.value
            }
            client.send(JSON.stringify(message));
            key_code_input.value = '';
        }
    })

    // Function for creating your own board and the opponent's board
    function createBoard(board, pos_y , idSlice , clickFunc){
        for (let y = 1; y <= 10; y++){
            const br = document.createElement('br');
            const showPos = document.createElement('div');
            showPos.innerText = `${y}`;
            showPos.classList.add('show_pos');
            pos_y.appendChild(showPos);
            for (let x = 1; x <= 10; x++){
                const pos = `${x}${idSlice}${y}`;
                const checkBox = document.createElement('input');
                const label = document.createElement('label');
                checkBox.onclick = clickFunc
                label.classList.add('for_checkbox');
                checkBox.type = 'checkbox';
                checkBox.dataset.pos = pos;
                checkBox.classList.add('pos_checkbox');
                checkBox.id = pos;
                label.setAttribute('for', pos);
                board.appendChild(checkBox);
                board.appendChild(label);
                    
            }
            board.appendChild(br);
        }
    };

    // Сreate your board
    createBoard(gameBoard, positions_y, '_',  (event)=>{
        if (can_remake_board){
            console.log('bebra');
            if (event.target.checked){
                if (max_box > 0){
                    max_box--;
                } else {
                    event.target.checked = false;
                }
            } else {
                max_box++;
            }
            count_box.innerText = `Осталось поставить: ${max_box}`;
        }
    });

    // Create enemy board
    createBoard(enemyBoard , positions_y2, 'e', (event)=>{
        event.target.checked = false;
        if (my_turn){
            event.target.disabled = true;
            message = {
                'action': 'atack',
                'atack': event.target.id.split('e')
            }
            client.send(JSON.stringify(message));
        } else {
            if (can_remake_board){
                setErrorData('Вы не вошли в игру чтобы атаковать');
            } else {
                setErrorData('Дождись своей очереди!');
            }
        }
    });

    //Сlient handler

    client.addEventListener('message', (data)=>{
        data_message = JSON.parse(data.data);
        console.log(data_message);
        switch (data_message['action']){
            case 'create_room':
                const text_key_room = document.getElementById('key_room');
                text_key_room.innerText = `Код комнаты: ${data_message['key_room']}`;
                break;
            case 'start':
                can_remake_board = false;
                turn_text.innerText = 'Жди своей очереди';
                break;
            case 'response_atack':
                const my_atack_label = document.querySelector(`[for="${data_message['response_atack']}"]`);
                if (data_message['success']){
                    console.log('success!');
                    my_atack_label.style.background = 'red';
                } else {
                    my_atack_label.style.background = 'grey';
                    my_turn = false;
                    turn_text.innerText = 'Жди своей очереди';
                }
                break;
            case 'enemy_atack':
                const enemy_atack_label = document.querySelector(`[for="${data_message['response_atack']}"]`);
                if (data_message['success']){
                    enemy_atack_label.style.background = 'red';
                } else {
                    enemy_atack_label.style.background = 'grey';
                }
                break;
            case 'your_turn':
                my_turn = true;
                turn_text.innerText = 'Твоя очередь!';
                break;
            
            case 'you_win':
                alert('you_win');
                break;

            case 'you_failed':
                alert('you_failed');
                break;

            case 'enemy_is_out':
                alert('the enemy is out');
                location.reload();
                break;

            case 'join':
                key_room.innerText = `Код комнаты ${data_message['key_code']}`;


            case 'error':
                switch (data_message['cause']){
                    case 'wait_your_turn':
                        console.log('ERROR!');
                        setErrorData('Дождись своей очереди!');
                        break;
                    case 'key_does_not_exist':
                        setErrorData('Неверный код комнаты');
                        break;
                    case 'game_is_full':
                        setErrorData('Эта комната полна');
                        break;    
                }
                break;
        }
    });
    
    start_btn.onclick = function(){
        const board = [];
        let xList = [];
        if (max_box === 0){
            for (i of gameBoard.children){
                if (i.tagName === 'INPUT'){
                    const x = i.dataset.pos.split('_')[0]
                    const value = i.checked;
                    xList.push(value)
                    if (x >= 10){
                        board.push(xList);
                        xList = [];
                    }
                }   
            }
            const board_message = {
                action: 'ready',
                board
            }
            client.send(JSON.stringify(board_message));
            // document.dele
        } else {
            error_div.innerText = 'Заполни поле полностью!'
        }
    }
});

