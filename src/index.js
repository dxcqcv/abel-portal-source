/**
 * Prevent webview being amplified on android
 */
(function() {
    if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
        handleFontSize();
    } else {
        document.addEventListener("WeixinJSBridgeReady", handleFontSize, false);
    }
    function handleFontSize() {
        // 设置网页字体为默认大小
        WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize' : 0 });
        // 重写设置网页字体大小的事件
        WeixinJSBridge.on('menu:setfont', function() {
            WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize' : 0 });
        });
    }
 })();

import './style.css'
import ReactDOM from 'react-dom/client'
import {Canvas} from '@react-three/fiber'
import Experience from './Experience.js'
import { StrictMode } from 'react'
import Debug from './Utils/Debug'

const root = ReactDOM.createRoot(document.querySelector('#root')) 


root.render(
	<StrictMode>
		<Debug />
		<Canvas
		// make pointerEvent and raycaster both work
		eventPrefix="client"
			camera={
				{
					fov: 70,
					aspect: window.innerWidth / window.innerHeight,
					near: 1,
					far: 4000,
					position: [0,250, 325]
				}
			}
		>
			<Experience />
		</Canvas>
	</StrictMode>
)