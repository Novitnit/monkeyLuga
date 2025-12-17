import { GameMainPage } from './page/game/main'
import { Mainpage } from './page/main'
import { registerRoute, renderRoute } from './routing'
import './style.css'

const root = document.getElementById('app')

registerRoute('/', new Mainpage())
registerRoute('/game', new GameMainPage())
registerRoute('/game/:roomId', new GameMainPage())

renderRoute(root!)