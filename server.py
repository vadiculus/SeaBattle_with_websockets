import asyncio
import websockets
import json
import secrets
import logging
from game import Game

JOIN = {}

logger = logging.getLogger('websockets')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

async def handler(websocket):
    game = Game()
    keyRoom = secrets.token_urlsafe(12)
    JOIN[keyRoom] = game
    game.connect_list.add(websocket)
    await websocket.send(json.dumps({'action': 'create_room',
                          'key_room': keyRoom}))
    async for message in websocket:
        try:
            data_message = json.loads(message)
            if data_message['action'] == 'join':
                try:
                    game = JOIN[data_message['key_room']]
                    if len(game.connect_list) < 2:
                        game.connect_list.add(websocket)
                        keyRoom = data_message['key_room']
                        print('joined')
                        await websocket.send(json.dumps({'action': 'join',
                                                         'key_code': data_message['key_room']}))
                    else:
                        await websocket.send(json.dumps({'action': 'error', 'cause': 'game_is_full'}))
                except KeyError:
                    await websocket.send(json.dumps({'action':'error',
                                                     'cause':'key_does_not_exist'}))
            if data_message['action'] == 'ready':
                await game.ready(data_message['board'], websocket)
            if data_message['action'] == 'atack':
                await game.atack(websocket,int(data_message['atack'][0]), int(data_message['atack'][1]))
        except websockets.ConnectionClosedOK:
            break
    else:
        if len(game.ready_list.keys()) >= 2:
            game.connect_list.remove(websocket)
            del game.ready_list[websocket]
            await list(game.ready_list.keys())[0].send(json.dumps({'action': 'enemy_is_out'}))
        else:
            game.connect_list.remove(websocket)
            try:
                del game.ready_list[websocket]
            except KeyError:
                pass


async def main():
    async with websockets.serve(handler, '', 8001):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())