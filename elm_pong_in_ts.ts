// -- See this document for more information on making Pong:
// -- http://elm-lang.org/blog/pong
// import Color exposing (..)
// import Graphics.Collage exposing (..)
// import Graphics.Element exposing (..)
// import Keyboard
// import Text
// import Time exposing (..)
// import Window


// -- MODEL

const [gameWidth, gameHeight] = [600,400];
const [halfWidth, halfHeight] = [300,200];


const enum State {Play, Pause};

type Ball =
  { x : number
  ; y : number
  ; vx : number
  ; vy : number
  };


type Player =
  { x : number
  ; y : number
  ; vx : number
  ; vy : number
  ; score : number
  };


type Game =
  { state : State
  ; ball : Ball
  ; player1 : Player
  ; player2 : Player
  };


// player : number -> Player
const player = (x:number):Player => ({ x, y: 0, vx: 0, vy: 0, score: 0 });


// defaultGame : Game
const defaultGame:Game =
  { state : State.Pause
  , ball : { x: 0, y: 0, vx: 200, vy: 200 }
  , player1 : player (20-halfWidth)
  , player2 : player (halfWidth-20)
  };


type Input =
  { space : boolean
  , dir1 : number
  , dir2 : number
  , delta : Date
  };


// -- UPDATE

// update : Input -> Game -> Game
const update = ({space, dir1, dir2, delta}, {state, ball, player1, player2}):Game => {
  let
    score1 =
      (ball.x > halfWidth) ? 1 : 0
    ,
    score2 =
      (ball.x < -halfWidth) ? 1 : 0
    ,
    newState =
      space ?
            state.Play :
            score1 != score2 ?
                             state.Pause :
                             state
    ,
    newBall =
      state == state.Pause ?
        ball :
        updateBall (delta, ball, player1, player2)
    ;

    return {
        state : newState,
        ball : newBall,
        player1 : updatePlayer (delta, dir1, score1, player1),
        player2 : updatePlayer (delta, dir2, score2, player2)
    };
};

// updateBall : Time -> Ball -> Player -> Player -> Ball
const updateBall = (dt, ball, paddle1, paddle2):Ball => {
    
  return near (0, halfWidth, ball.x) ?
    { x : 0, y : 0, vx : ball.vx, vy : ball.vy }
    :
    physicsUpdate(dt,
      {
          x : ball.x,
          y : ball.y,
          vx : stepV (ball.vx, within (paddle1, ball), within (paddle2, ball)),
          vy : stepV (ball.vy, (ball.y < 7 - halfHeight), (ball.y > halfHeight - 7))
      })
};

// updatePlayer : Time -> Int -> Int -> Player -> Player
const updatePlayer = (dt, dir, points, player):Player => {
    
    player.vy = dir * 200;
    
    let movedPlayer:Player = physicsUpdate(dt, player);
    // Need Object Spread operator support here
    // let newObj = {...obj}
    let newPlayer = Object.create(player.prototype);
    
    newPlayer.y = clamp (22-halfHeight, halfHeight-22, movedPlayer.y);
    newPlayer.score = player.score + points;
        
    return newPlayer;
}

const clamp = (a, b, c) => Math.max (b, Math.min (c, a));

const physicsUpdate = (dt, obj) => {
    
    // Need Object Spread operator support here
    // let newObj = {...obj}
    let newObj = Object.create(obj.prototype);
    
    newObj.x = obj.x + obj.vx * dt;
    newObj.y = obj.y + obj.vy * dt;
    
   return newObj;
};

const near = (k, c, n):Boolean => n >= k - c && n <= k + c;

const within = (paddle, ball) => near (paddle.x, 8, ball.x && near (paddle.y, 20, ball.y));

const stepV = (v, lowerCollision, upperCollision) => {
    
    lowerCollision ?
        Math.abs (v)
        :
        upperCollision ?
            -(Math.abs (v))
            :
            v
}

// -- VIEW

// view : (Int,Int) -> Game -> Element
const view = (w, h, game):Element => {
  let
    scores =
      txt ({ height: 50 }, game.player1.score + "  " + game.player2.score);

    container w h middle <|
    collage gameWidth gameHeight
      [ rect gameWidth gameHeight
          |> filled pongGreen
      , oval 15 15
          |> make game.ball
      , rect 10 40
          |> make game.player1
      , rect 10 40
          |> make game.player2
      , toForm scores
          |> move (0, gameHeight/2 - 40)
      , toForm (if game.state == Play then spacer 1 1 else txt identity msg)
          |> move (0, 40 - gameHeight/2)
      ]
}

const pongGreen = rgb( 60, 100, 60 );


const textGreen = rgb( 160, 200, 160 );


const txt = (f, string) => {
  Text.fromString string
    |> Text.color textGreen
    |> Text.monospace
    |> f
    |> leftAligned
}

const msg = "SPACE to start, WS and &uarr;&darr; to move";

const make = (obj, shape) => {
  shape
    |> filled white
    |> move (obj.x, obj.y)
}

// -- SIGNALS

main =
  Signal.map2 view Window.dimensions gameState


// gameState : Signal Game
gameState =
  Signal.foldp update defaultGame input


delta =
  Signal.map inSeconds (fps 35)


// input : Signal Input
input =
  Signal.sampleOn delta <|
    Signal.map4 Input
      Keyboard.space
      (Signal.map .y Keyboard.wasd)
      (Signal.map .y Keyboard.arrows)
      delta
