import websockets
import json

class Board():
    def __init__(self, board):
        self.board = board
        self.boxes = 20

    def __call__(self, *args, **kwargs):
        return self.board

class Game():
    def __init__(self):
        self.connect_list = set()
        self.turn = None
        self.ready_list = {}
        self.has_started = False

    async def ready(self, board, websocket):
        try:
            self.ready_list[websocket]
        except KeyError:
            self.ready_list[websocket] = Board(board)
            self.connect_list.add(websocket)
            if len(self.ready_list) == 2:
                self.turn = websocket
                self.has_started = True
                websockets.broadcast(self.connect_list,json.dumps({'action':'start'}))
                await self.turn.send(json.dumps({'action': 'your_turn'}))
                print('START')
    async def atack(self, websocket , x, y):
        if self.turn is websocket:
            for ws in self.ready_list.keys():
                if ws is websocket:
                    pass
                else:
                    if self.ready_list[ws].board[y-1][x-1]:
                        self.ready_list[ws].boxes -= 1
                        await websocket.send(json.dumps({'action':'response_atack',
                            'response_atack':'{}e{}'.format(x,y),
                                                   'success': True}))
                        await ws.send(json.dumps({'action': 'enemy_atack',
                                                  'response_atack': '{}_{}'.format(x, y),
                                                  'success': True}))
                        if self.ready_list[ws].boxes <= 0:
                            await websocket.send(json.dumps({'action': 'you_win'}))
                            await ws.send(json.dumps({'action': 'you_failed'}))

                    else:
                        await websocket.send(json.dumps({'action':'response_atack',
                                                         'response_atack': '{}e{}'.format(x, y),
                                                        'success': False}))
                        await ws.send(json.dumps({'action': 'enemy_atack',
                                                  'response_atack': '{}_{}'.format(x, y),
                                                  'success': False}))
                        await ws.send(json.dumps({'action': 'your_turn'}))

                        self.turn = ws
        else:
            await websocket.send(json.dumps({'action':'error','cause': 'wait_your_turn'}))

