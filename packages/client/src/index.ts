import { Mainpage } from './page/main'
import { registerRoute, renderRoute } from './routing'
import './style.css'

const root = document.getElementById('app')

registerRoute('/', new Mainpage())

renderRoute(root!)