import {
  PositionalAudio,
  useProgress,
  Text,
  Html,
  useTexture,
  PerspectiveCamera,
  useHelper,
  OrbitControls,
} from '@react-three/drei';
import {
  Suspense,
  useState,
  useReducer,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import * as THREE from 'three';
import { folder, useControls } from 'leva';
import { Perf } from 'r3f-perf';
import { useLoader, useThree, useFrame, extend } from '@react-three/fiber';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { persist, createJSONStorage } from 'zustand/middleware'

// shader
import fragment from './shader/fragment.js';
import vertex from './shader/vertexParticles.js';

// load assets
import colorTitles from './assets/color-tiles.png';
import scaleTexture from './assets/scale-texture.png';
import anitiles from './assets/ani-tiles.exr';
import random from 'canvas-sketch-util/random';

import  {ReactComponent as powerSvg}  from './assets/industry/power.svg';
import {ReactComponent as transportationSvg} from './assets/industry/transportation.svg';
import {ReactComponent as  biopharmaceuticalsSvg } from './assets/industry/biopharmaceuticals.svg';
import {ReactComponent as  communiactionSvg} from './assets/industry/communiaction.svg';
import {ReactComponent as  financeSvg} from './assets/industry/finance.svg';
import {ReactComponent as  quantumSvg} from './assets/industry/quantum.svg';

import {ReactComponent as iconClose } from './assets/icon/icon_close.svg';

import {ReactComponent as  startSvg} from './assets/start/start.svg';
import {ReactComponent as  loadingSvg} from './assets/start/loading.svg';

import logoImg from './assets/icon/logo2.png';
import checkIcon from './assets/icon/checkIcon.png';

import styled, { keyframes, css } from "styled-components";

// music
import explosionSound from './assets/music/explosion-v3.wav';
import backgroundSound from './assets/music/background.mp3';

// svg
import SideIcon from './svg/sideIcon.jsx';
import LoadingComponent from './svg/loading3.jsx';



import {ReactComponent as  audioOnIcon} from './assets/icon/audio/onIcon.svg';
import {ReactComponent as  audioOffIcon} from './assets/icon/audio/offIcon.svg';
import {ReactComponent as  audioOnWords} from './assets/icon/audio/onWords.svg';
import {ReactComponent as  audioOffWords} from './assets/icon/audio/offWords.svg';

// gsap
import { gsap } from 'gsap';
import { SplitText } from './Utils/gg';


// styled-components
const transitionCSS = css`
    transform-origin: center;
    transition: all .1s ease-in-out;

`

const svgStyled = css` 
  display: inline-block;
    @media(max-width: 768px) {
      width: ${(props ) =>  props.name === 'quantum' ? '48px' : '38px'} ;
      height: ${(props ) =>  props.name === 'quantum' ? '48px' : '38px'} ;
    }
    .icon-wrapper {
      ${transitionCSS }
    }
 ` 

const PowerStyled = styled(powerSvg)`${svgStyled}`
const CommuniactionStyled = styled(communiactionSvg)`${svgStyled}`
const BiopharmaceuticalsStyled = styled(biopharmaceuticalsSvg)`${svgStyled}`
const TransportationStyled = styled(transportationSvg)`${svgStyled}`
const FinanceStyled = styled(financeSvg)`${svgStyled}`
const QuantumStyled = styled(quantumSvg)`${svgStyled}`



const StartWrapperStyled = styled.div`
  position: related;

  cursor: pointer;
`

const GreettingStyled = styled.div`
  opacity: ${  (props = {opacity: 1}) => props.opacity};
  color: #fff;
  position: absolute; width: 100%; height: 100%; top: 0; 
  display: flex; justify-content: center; align-items: center;

  @media (max-width: 768px) {
    font-size: 12px
  }
`

const LoadingStyled = styled(loadingSvg)`
  width: 200px;
  height: 200px;
`
const audioCss = css`
  width: 56px;
  height: 73px;
`

const audioCssSmall = css`
  width: 24px;
  height: 24px;
`

const audioWordsCSS = css`
  width: 56px;
  height: 14px;
`

const IconsCloseStyled = styled(iconClose)`
	pointer-events: all;
  width: 24px;
  height: 24px;
`

const AudioOnIconStyled = styled(audioOnIcon)`
  ${audioCss}
  @media (max-width: 768px) {
    ${audioCssSmall}
  }
`
const AudioOffIconStyled = styled(audioOffIcon)`
  ${audioCss}
  @media (max-width: 768px) {
    ${audioCssSmall}
  }
`

const AudioOnWordsStyled = styled(audioOnWords)`${audioWordsCSS }`
const AudioOffWordsStyled = styled(audioOffWords)`${audioWordsCSS }`

const StartStyled = styled(startSvg)`
  @media (max-width: 768px) {
    width:205px;
    height:205px;
  }
`


// gsap init
gsap.registerPlugin(SplitText);



const splitTextAnimationObj = {
      duration: 0.8,
      scale: 0,
      // y: 80,
      y: 8,
      // rotationX: 180,
      rotationX: 90,
      transformOrigin: '0% 50% -50',
      ease: 'back',
      stagger: 0.01,
}

const splitTextAnimationFrom = {
  opacity: 0,
  scale: 0,
  // y: 80,
  y: 8,
  // rotationX: 180,
  rotationX: 90,
}
const splitTextAnimationTo = {
  opacity: 1,
  scale: 1,
  y: 0,
  rotationX: 0,
  duration: 0.8,
  transformOrigin: '0% 50% -50',
  ease: 'back',
  stagger: 0.01,
}


// store
const useBearStore = create(
  persist(
    (set, get) => ({
      stage: 0,
      setStage: (currentStage) => set({ stage: currentStage }),
      exrObj: null,
      setExrObj: (obj) => set((state) => ({ exrObj: obj })),
      rerenderGalaxy: false,
      setRerenderGalaxy: () => set({ rerenderGalaxy: !get().rerenderGalaxy }),
      showWords: false,
      setShowWords: (newShowWords) => set({showWords: newShowWords}),
      initMove: true,
      setInitMove: () => set({initMove: !get().initMove}),
      showIndustry: false,
      setShowIndustry: () => set({ showIndustry: !get() .showIndustry }),
      showReady: false,
      setShowReady: () => set({ showReady: ! get() .showReady }),
    }),
    {
      name: 'three-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ['stage', 'showWords', 'initMove', 'showIndustry', 'showReady'].includes(key)))
      
    }
  )

);

extend({ RawShaderMaterial: THREE.RawShaderMaterial });

const planets = [];
const planetsCoordinates = [];
for (let i = 0; i < 8; i++) {
  let x = 100 * Math.sin((Math.PI * 2 * i) / 8);
  let y = 100 * Math.cos((Math.PI * 2 * i) / 8);
  let z = 0;
  // let z = 1110;
  planets.push(new THREE.Vector3(x, z, y));
  planetsCoordinates.push({ x, y, z });
}

// Load EXR file
function EXRAssets() {
  const {setExrObj} = useBearStore((state) => ({
    setExrObj: state.setExrObj,
  }), shallow);
  // load EXR
  const anitilesTexture = useLoader(EXRLoader, anitiles);
  anitilesTexture.generateMipmaps = false;
  anitilesTexture.minFilter = THREE.NearestFilter;
  anitilesTexture.magFilter = THREE.NearestFilter;
  useEffect(() => {
    setExrObj(anitilesTexture )
  }, [anitilesTexture])
  return null;
}


// explosionSound 
// backgroundSound 
// load Music
function ExplosionMusic() {
  return (
    <PositionalAudio
distance={3}
  rolloffFactor={2}
  position={[0, 0, 1000]}
  url={explosionSound } 
  autoplay loop
    >
    </PositionalAudio>
  )
}

function Galaxy({ galaxyConfig, scalesT, colorsT}) {


  const galaxyRawShaderMaterialRef = useRef();
  const ballMeshRef = useRef();
  const planeMeshRef = useRef();
  const pointsRef = useRef();
  const {exrObj} = useBearStore((state) => ({
    exrObj: state.exrObj
  }), shallow)

  const anitilesTexture = exrObj



  const count = 32768;
  // const randomRange = 300
  const randomRange = 600;

  const pointsAttr = useMemo(() => {
    const positionsArr = new Float32Array(count * 3);
    const aUV = new Float32Array(count * 3);
    let level = 0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positionsArr[i3] = random.range(-randomRange, randomRange);
      positionsArr[i3 + 1] = random.range(-randomRange, randomRange);
      positionsArr[i3 + 2] = random.range(-randomRange, randomRange);
    }

    for (let j = 0; j < 128; j++) {
      for (let k = 0; k < 256; k++) {
        aUV[level * 2] = 1 / 256 + k / 257;
        aUV[level * 2 + 1] = 1 / 128 + j / 129;
        level++;
      }
    }

    return {
      positionsArr,
      aUV,
    };
  }, []);

  const { size } = useThree();

  useEffect(() => {
    const { height, width } = size;
    // Perform any resize-related actions here
    if(width < 1000){
      galaxyConfig.communiactionX = 50;
    }
    if(width < 500) {
      galaxyConfig.financeX = -150
      galaxyConfig.powerX = 150
      galaxyConfig.transportationX= -50
      galaxyConfig.transportationZ= 50

      galaxyConfig.communiactionX = 80;
    }
  }, [size]);


  useFrame((state, delta) => {
    const { camera, mouse, raycaster } = state;
    // galaxy animation
    galaxyRawShaderMaterialRef.current.uniforms.time.value += delta * 6;

    // move sphere
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([planeMeshRef.current]);

    if (intersects[0]) {
      let p = intersects[0].point;
      galaxyRawShaderMaterialRef.current.uniforms.interaction.value.x = p.x;
      galaxyRawShaderMaterialRef.current.uniforms.interaction.value.y = p.y;
      galaxyRawShaderMaterialRef.current.uniforms.interaction.value.z = p.z;
      galaxyRawShaderMaterialRef.current.uniforms.interaction.value.w = 1;

      // // only hover then use it
      galaxyRawShaderMaterialRef.current.uniforms.hoverPoint.value.x = p.x;
      galaxyRawShaderMaterialRef.current.uniforms.hoverPoint.value.y = p.y;
      galaxyRawShaderMaterialRef.current.uniforms.hoverPoint.value.z = p.z;

      ballMeshRef.current.position.copy(p);
    }


  });









  const industryInfo = [
    {
      position: [galaxyConfig.powerX,galaxyConfig.powerY,galaxyConfig.powerZ],
      smallPosition: [],
      engTitle: 'POWER',
      title: '电力行业',
      imgSrc:  PowerStyled ,
      small: '48px',
      lightColor: '#4676f0',
      name: 'power',
      link: '/web/solution?id=29'
    },

    {
      position: [ galaxyConfig.communiactionX, galaxyConfig.communiactionY, galaxyConfig.communiactionZ ],
      smallPosition: [],
      engTitle: 'COMMUNICATION',
      title: '通信行业',
      imgSrc: CommuniactionStyled ,
      small: '48px',

      lightColor: '#0064b9',
      name: 'communiaction',
      link: '/web/solution?id=28'
    },

    {
      position: [galaxyConfig.biopharmaceuticalsX, galaxyConfig.biopharmaceuticalsY, galaxyConfig.biopharmaceuticalsZ],
      smallPosition: [],
      engTitle: 'BIO-PHARMACEUTICAL',

      small: '48px',
      title: '生物制药行业',
      imgSrc:BiopharmaceuticalsStyled  ,

      lightColor: '#d072f1',
      name: 'biopharmaceuticals',
      link: '/web/solution?id=27'
    },
    {
      position: [galaxyConfig.transportationX, galaxyConfig.transportationY, galaxyConfig.transportationZ],
      smallPosition: [],
      engTitle: 'TRANSPORTATION & LOGISTICS',
      title: '交通物流行业',
      imgSrc: TransportationStyled   ,

      small: '48px',
      lightColor: '#9f5ef1',

      name: 'transportation',
      link: '/web/solution?id=21'
    },
    {

      position: [galaxyConfig.financeX, galaxyConfig.financeY,galaxyConfig.financeZ],
      smallPosition: [],
      engTitle: 'FINANCE',
      title: '金融行业',
      imgSrc: FinanceStyled  ,

      small: '48px',
      lightColor: '#6d48ff',
      name: 'finance',
      link: '/web/solution?id=26'
    },


    {
      position: [galaxyConfig.quantumX, galaxyConfig.quantumY, galaxyConfig.quantumZ ],
      engTitle: 'Tiangong QBrain',
      title: '天工量子大脑',
      imgSrc: QuantumStyled  ,

      small: '48px',
      lightColor: '#fff',
      name: 'quantum',
      link: '/web/product'
    },
  ];

  return (
    <>
      <points ref={pointsRef} rotation-x={Math.PI / 2}>
        <bufferGeometry>
          <bufferAttribute
            attach='attributes-position'
            count={count}
            itemSize={3}
            array={pointsAttr.positionsArr}
          />
          <bufferAttribute
            attach='attributes-uv'
            itemSize={2}
            array={pointsAttr.aUV}
          />
        </bufferGeometry>

        <rawShaderMaterial
          ref={galaxyRawShaderMaterialRef}
          args={[
            {
              extensions: {
                derivatives: '#extension GL_OES_standard_derivatives : enable',
              },
              side: THREE.DoubleSide,
              uniforms: {
                resolution: { value: new THREE.Vector4() },
                time: {
                  value: galaxyConfig.time,
                },
                duration: {
                  value: galaxyConfig.duration,
                },
                envStart: {
                  value: galaxyConfig.envStart,
                },
                interpolate: {
                  value: galaxyConfig.interpolate,
                },
                fade: {
                  value: galaxyConfig.fade,
                },
                fdAlpha: {
                  value: galaxyConfig.fdAlpha,
                },
                globalAlpha: {
                  value: galaxyConfig.globalAlpha,
                },
                posTex: {
                  // value: galaxyConfig.posTex
                  value: anitilesTexture,
                },
                color: {
                  // value: galaxyConfig.color
                  value: colorsT ,
                },
                scaleTex: {
                  // value: galaxyConfig.scaleTex
                  value: scalesT,

                },
                scale: {
                  value: galaxyConfig.scale,
                },
                size: {
                  value: galaxyConfig.size,
                },
                nebula: {
                  value: galaxyConfig.nebula,
                },
                focalDistance: {
                  value: galaxyConfig.focalDistance,
                },
                aperture: {
                  value: galaxyConfig.aperture,
                },
                maxParticleSize: {
                  value: galaxyConfig.maxParticleSize,
                },
                tint: {
                  value: new THREE.Color('#fff'),
                },
                glow: {
                  value: galaxyConfig.glow,
                  // value:0
                },
                superOpacity: {
                  value: galaxyConfig.superOpacity,
                },
                superScale: {
                  value: galaxyConfig.superScale,
                },
                hover: {
                  value: galaxyConfig.hover,
                },
                planets: {
                  value: planets,
                },
                hoverPoint: {
                  value: new THREE.Vector3(0, 0, 0),
                },
                interaction: {
                  value: new THREE.Vector4(0, 0, 0, 0),
                },
                iRadius: {
                  // value: 11
                  value: galaxyConfig.iRadius,
                },
                nebulaAmp: {
                  value: galaxyConfig.nebula,
                },
              },
              // wireframe: true,
              transparent: true,
              vertexShader: vertex,
              fragmentShader: fragment,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            },
          ]}
        />
      </points>

      <mesh ref={ballMeshRef}>
        <sphereGeometry args={[galaxyConfig.iRadius, 16, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh ref={planeMeshRef} rotation-x={-Math.PI / 2} visible={false}>
        <planeGeometry args={[1000, 1000]}></planeGeometry>
        <meshBasicMaterial transparent />
      </mesh>

			<TopNav pointsRefProps={pointsRef} />
      <Words pointsRefProps={pointsRef} />
      {industryInfo.map((industry, index) => {
        return (
          <Industry
            key={industry.title}
            industry={industry}
            galaxyRawShaderMaterialRefProps={galaxyRawShaderMaterialRef}
          />
        );
      })}
    </>
  );
}




function Industry({ industry, galaxyRawShaderMaterialRefProps }) {

  const [isShow, setIsShow] = useState(false);
  const titleEle = useCallback(node => {
    if(node) {
      // detective ref is loaded
      setIsShow(true);
    }
  },[])
  const htmlRef = useRef();
  const charsRef = useRef(null);
  const [charsArr, setCharsArr] = useState([])

	const iconRef = useRef()

  const { stage,  showIndustry } = useBearStore(
    (state) => ({ 
      showIndustry: state.showIndustry ,
      stage: state.stage 
    }),
    shallow
  );

  const handleClick = (name) => {
    console.log(`click ${name}`);

    location.assign(industry.link)
  };
  const handleOver = () => {
    if (!showIndustry) return;
    // setRealImgSrc(industry.imgSrcHover);
    galaxyRawShaderMaterialRefProps.current.uniforms.tint.value = new THREE.Color(industry.lightColor);


    // make everything dark but highlight
    gsap.to(galaxyRawShaderMaterialRefProps.current.uniforms.hover, {
      duration: 1,
      value: 1,
    });
  };

  const handleOut = () => {

    if (!showIndustry) return;
    // setRealImgSrc(industry.imgSrc);
    gsap.to(galaxyRawShaderMaterialRefProps.current.uniforms.hover, {
      duration: 1,
      value: 0,
    });
  };

  useEffect(() => {
    if(!htmlRef.current) return
    const split = new SplitText(htmlRef.current, { type: 'chars, words' });
    setCharsArr([...split.chars] )

  }, [htmlRef.current ,isShow])



  // gsap effect
  useEffect(() => {
    // If  _isSplit is true, then the entire splitText array is not text and will cause the text not to be displayed
    if(!charsArr.length || charsArr[0]._isSplit) return
    if(!htmlRef.current || !iconRef.current) return
    let ctx = gsap.context(() => {
      if (showIndustry) {

        const tl = gsap.timeline();
        tl
          .delay(2)
          // .set('.item', { visibility: 'visible' })
          .set(htmlRef.current, { visibility: 'visible' })
          .fromTo(charsArr , 
            Object.assign( splitTextAnimationFrom, {visibility: 'hidden', 
          }) , 
            Object.assign( splitTextAnimationTo, {visibility: 'visible', 
          }) , 
            );


        tl.fromTo(iconRef.current, {
          visibility: 'hidden',

        }, {

          visibility: 'visible',
          duration: 0.1
        })

      }  else{
        const tl = gsap.timeline();

        tl
          .to(charsArr, 
            Object.assign({}, splitTextAnimationObj, {
                visibility: 'hidden',
              })
          )

        tl.to(iconRef.current, {
          duration: .1,

          visibility: 'hidden'
        })
      }

    }, htmlRef)

    return () => {
      ctx .revert()
    } 

  }, [showIndustry, charsArr, iconRef.current, htmlRef.current,isShow]);



  return (
    <>
      {

        <Html
          center
          position={industry.position}
          wrapperClass='industry-wrapper'
          zIndexRange={[0, 1]}
        >
          {
              <div
                ref={htmlRef}
                // hack
                style={showIndustry ? {display: 'block'}:{display: 'none'}}
                className={industry.name === 'transportation' ? 'item  transportationSmallItem' : 'item'} 
                onClick={handleClick}
                onPointerOver={handleOver}
                onPointerOut={handleOut}
              >
                <div ref={titleEle } className='eng-title'>{industry.engTitle}</div>
                <div className='industry-title'>{industry.title}</div>
                <div ref={iconRef}>
                  <industry.imgSrc name={industry.name} />
                </div>

              </div>

          }
        </Html>
      }
    </>
  );
}



const  NavComponent = ({name, link}) => {
  const handleClick = () => {
    if(!link) return
    location.assign(link)
  }
  return (
    <div onClick={handleClick }>
      <span>{name}</span>
            
    </div>
  )
}
// Top Nav
function TopNav() {
  const [showNav, setShowNav] = useState(true)
  const [showMobelNav, setShowMobelNav] = useState(false)


  const { setStage, setInitMove, setShowWords, initMove, showWords , setShowIndustry } = useBearStore(
    (state) => ({
      setShowIndustry : state.setShowIndustry  ,
      showWords : state.showWords ,
      setShowWords: state.setShowWords,
      setInitMove: state.setInitMove,
      initMove :  state.initMove,
      setStage: state.setStage
    }),
    shallow
  );

  const { size } = useThree();
  useEffect(() => {
    const { height, width } = size;
    if(width < 750) {
      setShowNav(false)
    } else {
      setShowNav(true)
    }
    // Perform any resize-related actions here
  }, [size]);

  const handleSideBarClick = () => {

    const { height, width } = size;
    if(width > 750) return
    
    setShowMobelNav(!showMobelNav) 
  }




  const logoFn = () => {
    setInitMove();
    // toggle
    setShowIndustry();

    // delay
    setTimeout(() => {
      // show words
      setShowWords(true)

      // return to stage1
      setStage(1)
    }, 1000)
  }
  const links = [
    {
      name: '首页',
      link: ''
    },
    {
      name: '新闻',
      link: '/web/news'
    },
    {
      name: '企业',
      link: '/web/companyIntro'
    },
    {
      name: '招聘',
      link: '/web/recruitment'
    }
  ] 

  const handleCloseIcon = () => {
    console.log(111) 
  }

	return (
    <>
      <Html fullscreen wrapperClass='top-nav-wrapper top-nav-container' 
        zIndexRange={[1000, 10]}
      >

          {
            showMobelNav ?
              <div className='mobile_wrapper'>
                <div className='mobile_header'>
                  <div className='mobile_close' >
                      {<IconsCloseStyled onClick={handleSideBarClick  } /> }
                  </div>
                  {
                    links.map((item, index) => (
                      <NavComponent  key={index} {...item} />
                    ))
                  }
                </div>
              </div>
            
             : null
          }

          <div className='inner'>
            <div className='side'>

              <div className='logo' onClick={logoFn}>
                <img src={logoImg} alt='logo' />
              </div>
              <div
                className={
                  showMobelNav ? 'side-bar  mobile-side-bar' : 'side-bar'
                }
                onClick={handleSideBarClick}
              >

              {

                <SideIcon />

              }
              </div>
            </div>
            {showNav ? (
              <div className='nav'>
                {
                  links.map((item, index) => (
                    <NavComponent  key={index} {...item} />
                  ))
                }
              </div>
            ) : null}
          </div>


      </Html>
    </>
  );
}

function Words({ pointsRefProps }) {
  const countRef = useRef(9);
  const htmlRef = useRef();
  const charsRef = useRef();
	const iconRef = useRef()
  const wrapRef = useRef()

  const [charsArr, setCharsArr] = useState([])


  const { stage, setStage ,setInitMove, setShowWords, initMove, showWords , setShowIndustry } = useBearStore(
    (state) => ({
      setShowIndustry : state.setShowIndustry  ,
      showWords : state.showWords ,
      setShowWords: state.setShowWords,
      setInitMove: state.setInitMove,
      initMove :  state.initMove,
setStage : state.setStage,
stage: state.stage
    }),
    shallow
  );

  useFrame((state, delta) => {

    const { camera, mouse, raycaster } = state;
    countRef.current += delta * 6;

    // trigger under 60fps
    if (countRef.current >= 50 && !showWords && stage === 1) {
      setShowWords(true);
    }

    // move points
    if (countRef.current >= 25) {
      if (pointsRefProps.current.position.x < 70 && initMove) {
        pointsRefProps.current.position.x += delta * 50;
        pointsRefProps.current.position.z += -(delta * 50);
        pointsRefProps.current.position.y += delta * 30;
      }
    }

    // move points
    if(!initMove) {
      gsap.to(pointsRefProps.current.position, {
        x: THREE.MathUtils.lerp(pointsRefProps.current.position.x, mouse.x * 1.9, 1.0),
        y: THREE.MathUtils.lerp(pointsRefProps.current.position.y, mouse.y * 1.9, 1.0),
        duration: 1
      })
    }
  });

    // avoid multiple instances
  useEffect(() => {
    const split = new SplitText(htmlRef.current, { type: 'chars, words' });

    setCharsArr(split.chars)
  },[htmlRef.current])

  // show side words 
  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (showWords && charsArr.length > 0 ) {

        tl
        .set('.wrapper', { opacity: 1  })
        .fromTo(charsArr, 

          splitTextAnimationFrom ,
          splitTextAnimationTo
        );

          // delay show icon
        tl.fromTo(iconRef.current, {
          opacity: 0,
          scale: 0,
        }, {
          opacity: 1,
          scale: 1,
          duration: 0.1
        })
      } 
    },wrapRef )

    return () => ctx.revert()
  }, [showWords, charsArr]);


  const handleClick = ({ currentTarget }) => {


    const tl = gsap.timeline();

    tl
    .to([charsArr, iconRef.current] , 
      Object.assign({}, splitTextAnimationObj, {
          opacity: 0,
        }),
    );


    tl.to(pointsRefProps.current.position, {
      duration: .8,
      x: 0,
      y: 0,
      z: 0,
    });

    tl.to(pointsRefProps.current.scale, {
      duration: .8,
      x: .65,
      y: .65,

      onComplete: () => {
        
        setInitMove(false);
        setShowIndustry();

        // change stage and disappear show words
        // trigger under 60fps
        
        setShowWords(false)
        setStage (2)
      }
    });



  };

  return (
    <>
      <Html
        wrapperClass='topWords'
        fullscreen
        zIndexRange={[0, 1]}
        ref={wrapRef}
      >
        <div className='wrapper' ref={htmlRef}>
          <p className='top-desc'>量子计算硬件+算法解决方案一体化</p>
          <h1 className='title'>
            玻色量子
            <br></br>
            实用化量子计算 
          </h1>
          <p className='bottom-desc'>
            玻色量子聚焦光量子计算技术路线，致力于可扩展、可编程光量子计算的各类型软硬件全平台研发与产业落地，建立上下游生态链和产业链，不断完善量子计算对AI、大数据、生物医药等各类问题的计算加速应用，以解决未来时代的算力需求，占领全球前沿硬科技发展先机。
          </p>
          <button
            className='check'
            onClick={handleClick}
            style={{ pointerEvents: 'all' }}
          >
            <span className='check-words'>查看详情</span>
            <img className='check-icon' ref={iconRef} src={checkIcon }></img>
          </button>
        </div>
      </Html>
    </>
  );
}

function Loader() {
  const { active, progress, errors, item, loaded, total } = useProgress();
  useEffect(() => {
    console.log({
      active,
      progress,
      loaded,
      total,
      item,
    });
  }, [active, progress]);
  // not real progress loading
  return (
    <Html center>
        <div className='loading'  >
          <div >加载中</div>
          <LoadingComponent />
        </div>
    </Html>
  );
}

function Ready() {
  const {  setStage,  showReady, setShowReady } = useBearStore(
    (state) => ({
      showReady: state.showReady,
      setShowReady: state.setShowReady,
      setStage: state.setStage,
    }),
    shallow
  );
  const [showAudioOn, setShowAudioOn] = useState(true);
  const svgRef = useRef()
  const defaultWords = useRef()
  const hoverWords = useRef()

  const [hitSound] = useState(() => new Audio(explosionSound))
  const [backgroundLoaded] = useState(() => new Audio(backgroundSound))

  const handleReady = () => {
    
    setShowReady();
    // enter stage 1
    setStage(1)

    if(!showAudioOn) return
    // delay 1.5s play explosion sound
    setTimeout(() => {
      hitSound.currentTime = 0
      hitSound.volume = 0.7 
      
      hitSound .play()
    },1100)
  };
  useEffect(() => {
    hitSound.addEventListener("ended", () => {
      if(!backgroundLoaded || !showAudioOn) return
      backgroundLoaded.currentTime = 0
      backgroundLoaded.volume =0.03 
      backgroundLoaded.loop = true
      
      backgroundLoaded.play()
    });

  },[hitSound, backgroundSound, showAudioOn])



  const handleHover = () => {

    let ctx = gsap.context((el) => {
      gsap.to('circle' , {
        stroke: '#1759F1' ,
        duration: 0.2,
      })

      gsap.to(svgRef.current, {
        scale: 1.1,
        duration: 0.2,
      })


  const hoverSplit = new SplitText(hoverWords.current, { type: 'chars, words' });

      gsap.set(defaultWords.current, {opacity: 0})
       gsap .set(hoverWords .current, {opacity: 1})
        gsap.from(hoverSplit  .chars, 
          
      Object.assign({}, splitTextAnimationObj, {
          opacity: 1,
        }),

        );




    }, svgRef)



  }

  const handleLeave = () => {

    let ctx = gsap.context((el) => {
      gsap.to('circle' , {
        stroke: '#fff' ,
        duration: 0.2,
      })

  const defaultSplit = new SplitText(defaultWords .current, { type: 'chars, words' });
      gsap.to(svgRef.current, {
        scale: 1,
        duration: 0.2,
      })
      gsap.set(hoverWords.current, {opacity: 0})
       gsap .set(defaultWords.current, {opacity: 1})
        gsap.from(defaultSplit  .chars,
          
      Object.assign({}, splitTextAnimationObj, {
          opacity: 1,
        }),

        );



    }, svgRef)
  }
  
  const handleAudio = () => {
    if(showAudioOn) {
backgroundLoaded.pause()
hitSound.pause()
      setShowAudioOn(false)
    } else {


      backgroundLoaded.currentTime = 0
      backgroundLoaded.volume =0.03 
      backgroundLoaded.loop = true
      backgroundLoaded.play()

      setShowAudioOn(true)
    }
  }
  return (
    <>
      {showReady ? null : (
        <Html center>

          <StartWrapperStyled onClick={handleReady} onMouseEnter={handleHover} onMouseLeave={handleLeave} >
            <StartStyled  ref={svgRef}  />
            <GreettingStyled ref={defaultWords } >点击进入了解玻色量子应用</GreettingStyled>
            <GreettingStyled opacity='0' ref={hoverWords } >开始旅程</GreettingStyled>
          </StartWrapperStyled>

          {/* <div className='ready-wrapper' onClick={handleReady}>
            <div className='ready-img'></div>
          </div> */}
        </Html>
      )}
      <Html
           fullscreen wrapperClass='top-nav-wrapper'

        zIndexRange={[0, 1]}
      >
        <div className='audioBox' onClick={handleAudio}>
          {
            showAudioOn ?
              <div >
                <AudioOnIconStyled />
                <div className='audioWords'>
                  <AudioOnWordsStyled />
                </div>
              </div>
            :
              <div>
                <AudioOffIconStyled />
                <div className='audioWords'>
                  <AudioOffWordsStyled />
                </div>
              </div>
          }
        </div>
      </Html>
    </>
  );
}

function Copyright() {
  return (
    <Html fullscreen  wrapperClass='top-nav-wrapper'

          zIndexRange={[0, 1]}
    >
      <div className='copyrightBox'>
        <div className='copyright-big'>
          <p >Copyright  2023 玻色量子科技 All Rights Reserved. 备案号 : 京ICP备2021019544号-1 京公网安备 11010502045479号 </p >
        </div>
        <div className='copyright-small' >
          <p>Copyright  2023 玻色量子科技 All Rights Reserved.备案号 : 京ICP备2021019544号-1 京公网安备 11010502045479号</p >
        </div>
      </div>
    </Html>
  )
}

export default function Experience() {
  const cameraRef = useRef();
  const { showReady } = useBearStore(
    (state) => ({ showReady: state.showReady }),
    shallow
  );

  // Helper
  const { showLeva, helperVisible } = useControls('showHelper', {
    showLeva: false,
    helperVisible: false,
  });

  // trigger resize
  const { size } = useThree();
  const {width, height} = size
  const transportationCoordinates = {
      transportationX: -180,
      transportationY: 0,
      transportationZ: 0,
    }

  const communiactionCoordinates = 
{
      communiactionX: 150,
      communiactionY: 0,
      communiactionZ: 50,
    }

    const financeCoordinates = {
      financeX: -200,
      financeY: 0,
      financeZ: -350,
    }
    const powerCoordinates = {

      powerX: 200,
      powerY: 0,
      powerZ: -350,
    }
    const quantumCoordinates = {

      quantumX: 0,
      quantumY: 0,
      quantumZ: -100,
    }
    const biopharmaceuticalsCoordinates = {

      biopharmaceuticalsX: 0,
      biopharmaceuticalsY: 0,
      biopharmaceuticalsZ: 150,
    }

  if(width < 768) {
    quantumCoordinates.quantumZ = -50
    financeCoordinates.financeX = -100 
    powerCoordinates.powerX = 100
    powerCoordinates.powerZ = -300
    transportationCoordinates.transportationX = -150
    transportationCoordinates.transportationX = -70 
    transportationCoordinates.transportationZ = 40 
    communiactionCoordinates .communiactionX = 80
  }

  // tweak config
  const galaxyConfig =  useControls('galaxy', {
    time: 9,
    duration: 100,
    envStart: 1.25,
    interpolate: true,
    fade: 0,
    fdAlpha: 0,
    globalAlpha: 1,
    posTex: 0,
    color: '#fff',
    scaleTex: 0,
    scale: 1, // boom range of scale 
    size: 1.6, // galaxy size 
    nebula: true,
    focalDistance: 385,
    aperture: 100,
    maxParticleSize: 18,
    // hightlight color
    tint: '#fff',
    glow: false,
    superOpacity: 1,
    superScale: 1,
    // control highlight or not 1.0 is only highlight pointHover
    // hover: 0,
    hover: 0.0,
    iRadius: 21,
    nebulaAmp: 5,
    '金融行业定位': folder(financeCoordinates ),
    '电力行业': folder(powerCoordinates ),
    '天工量子大脑': folder(quantumCoordinates ),
    '交通物流行业': folder(transportationCoordinates ),
    '通信行业': folder(communiactionCoordinates ),
    '生物制药行业': folder(biopharmaceuticalsCoordinates ),
  });

  // load color and scale
  const [scalesT, colorsT] = useTexture([scaleTexture, colorTitles]);
  scalesT.minFilter = THREE.NearestFilter;
  scalesT.magFilter = THREE.NearestFilter;

  colorsT.minFilter = THREE.NearestFilter;
  colorsT.magFilter = THREE.NearestFilter;
  useTexture.preload([scaleTexture, colorTitles]);

  return (
    <>
      {showLeva ? <Perf position='top-left' /> : null}

      <PerspectiveCamera ref={cameraRef} />


      <color args={['#000']} attach='background' />

      <Suspense fallback={<Loader />}>
        <EXRAssets />
        <Ready />
        <Copyright />
        
      </Suspense>
      {/* get error if load useTexture */}
      {showReady ? <Galaxy galaxyConfig={galaxyConfig}  scalesT={scalesT} colorsT={colorsT} /> : null}

    </>
  );
}
