// clearing the console (just a CodePen thing)
import './index.scss'

import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import TextPlugin from "gsap/TextPlugin"

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'


gsap.registerPlugin(ScrollTrigger)
gsap.registerPlugin(TextPlugin)

// create the scene
class Scene {

  constructor() {
    this.rotate = 1
    this.model = null
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    // create the two views (one for the model, one for the line)
    this.views = [
      {
        left: 0,
        bottom: 0,
        width: 1,
        height: 1,
        eye: [0, 0, 15]
      },
      {
        left: 0,
        bottom: 0,
        width: 1,
        height: 0,
        eye: [0, 0, 15]
      }
    ]
    this.init()
    this.animate()
  }

  init() {
    // create the camera for all the views
    for (let i = 0; i < this.views.length; ++i) {
      const view = this.views[i]
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
      camera.layers.disableAll()
      camera.layers.enable(i)
      view.camera = camera
    }

    // add light
    const pointLight = new THREE.PointLight(0xffffff, 0.75)
    pointLight.position.z = 150
    pointLight.position.x = 70
    pointLight.position.y = -20
    this.scene.add(pointLight)

    const light = new THREE.AmbientLight(0xFFFFFF, 0.35); // soft white light
    this.scene.add(light)

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.canvas = this.renderer.domElement
    document.body.appendChild(this.canvas)

    this.loadModel()
  }

  updateSize() {
    if (this.w !== window.innerWidth || this.h !== window.innerHeight) {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.renderer.setSize(this.w, this.h)
    }
  }

  render() {
    this.updateSize()
    for (let i = 0; i < this.views.length; ++i) {
      const view = this.views[i]
      const camera = view.camera

      const bottom = Math.floor(this.h * view.bottom)
      const height = Math.floor(this.h * view.height)
      const left = Math.floor(this.w * view.left)
      const width = Math.floor(this.w * view.width)

      this.renderer.setViewport(left, bottom, this.w, this.h)
      this.renderer.setScissor(left, bottom, width, height)
      this.renderer.setScissorTest(true)

      camera.aspect = this.w / this.h

      camera.position.fromArray(view.eye)
      camera.position.z = this.w < 768 ? (768 / this.w * 15) : 15;

      camera.updateProjectionMatrix()
      camera.lookAt(this.scene.position)

      this.renderer.render(this.scene, camera)
    }
  }

  loadModel() {
    const loader = new GLTFLoader()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/examples/js/libs/draco/')
    loader.setDRACOLoader(dracoLoader)

    const scene = this.scene

    // Load a glTF resource
    loader.load('models/charmander/model.gltf',
      (gltf) => {
        console.log(gltf)
        // scene.add(gltf.scene)

        const model = gltf.scene
        // model.traverse(child => {
        //   if (child.isMesh) {
        //     child.geometry.center() // center here
        //   }
        // });

        // scene.add(model)

        // const findType = (object, type) => {
        //   object.children.forEach((child) => {
        //     if (child.type === type) {
        //       return child
        //     }
        //     findType(child, type)
        //   });
        // }

        const mesh = model.children[0].getObjectByName('node_MeshObject62876672-PolyPaper21')
        mesh.traverse(child => {
          if (child.isMesh) {
            child.geometry.center() // center here
          }
        });
        const edges = new THREE.EdgesGeometry(mesh.geometry)
        const line = new THREE.LineSegments(edges)
        // line.material.depthTest = false
        // line.material.opacity = 0.5
        // line.material.transparent = true
        // line.position.x = 0.5
        // line.position.z = -1
        // line.position.y = 0.2

        this.model = new THREE.Group()
        model.layers.set(0)
        line.layers.set(1)
        this.model.add(model)
        this.model.add(line)

        this.model.traverse(child => {
          if (child.isMesh) {
            child.geometry.center() // center here
          }
        });

        this.model.position.x = 2
        this.model.position.y = 0
        this.model.scale.multiplyScalar(5)
        this.scene.add(this.model)

        this.animate()
        this.launchScroll()
      },
      // called while loading is progressing
      function (xhr) {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // called when loading has errors
      function (error) {
        console.log('An error happened', error)
      }
    )
  }

  animate() {
    this.render()
    
    if (this.model && this.rotate === 1) {
      this.model.rotation.y -= 0.01 % Math.PI
    }

    requestAnimationFrame(() => this.animate())
  }

  launchScroll() {
    // On load, make the charmander apear from the right
    gsap.from(this.model.position, { duration: 2, x: 10 })

    // title
    const title = document.querySelector('h1')
    const text = title.querySelector('span[data-text]')
    const dot = title.querySelector('span[data-repeat]')


    const delay = 1.5
    gsap.to(text, { duration: delay, text: text.dataset.text, ease: "linear" })
    // repeat the dot infinitely
    const tl = gsap.timeline({ repeat: -1 })
    tl.to(dot, { duration: 0.5, text: dot.dataset.repeat, ease: "linear" }, delay)

    // section 1
    gsap.to('.scroll', {
      opacity: 0,
      scrollTrigger: {
        scrub: true,
        trigger: '.content',
        start: 'top top',
        end: '+=150'
      }
    })


    // section 2
    // Stop auto rotate
    gsap.fromTo(this,
      { rotate: 1 },
      { rotate: 0,
      scrollTrigger: {
        scrub: true,
        trigger: ".section--2",
        start: "top bottom",
        end: "+=10"
      }
    })

    gsap.fromTo(this.model.position,
      { x: 2 },
      {
        x: -4,
        scrollTrigger: {
          scrub: true,
          trigger: ".section--2",
          start: "top bottom",
          end: "bottom bottom"
        }
      }
    )

    gsap.to(this.model.rotation,
      {
        y: 2 * Math.PI,
        scrollTrigger: {
          scrub: true,
          trigger: ".section--2",
          start: "top bottom",
          end: "bottom bottom"
        }
      }
    )

    // section 3
    gsap.fromTo(this.model.position,
      { x: -4 },
      {
        x: 4,
        scrollTrigger: {
          scrub: true,
          trigger: ".section--3",
          start: "top bottom",
          end: "bottom bottom"
        }
      }
    )

    gsap.fromTo(this.model.rotation,
      { y: 2 * Math.PI },
      {
        y: 0,
        scrollTrigger: {
          scrub: true,
          trigger: ".section--3",
          start: "top bottom",
          end: "bottom bottom"
        }
      }
    )

    gsap.fromTo(this.views[1], 
        {height: 0 },
        { 
          height: 1,
          ease: 'none',
          scrollTrigger: {
            scrub: true,
            trigger: ".section--3",
            start: "top bottom",
            end: "bottom bottom"
          }
        })

    gsap.fromTo(this, 
      {rotate: 1},
      {rotate: 1,
      scrollTrigger: {
        trigger: ".section--3",
        start: "bottom bottom",
        end: "bottom bottom"
      }
    })

  }
}

new Scene()







