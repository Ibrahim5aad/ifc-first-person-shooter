import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Quaternion,
  Vector3
} from "three";
 
import { IFCLoader } from "web-ifc-three/IFCLoader";
import InputHandler from './input-handler'
import PlayerControls from './entities/player/player-controls'
import EntityManager from './entities/entity-manager'
import Entity from './entities/entity'


class App{
 
  constructor(){

    this.lastFrameTime = null;
    this.assets = {};
    this.animFrameId = 0;
    this.Init();
  }

  Init(){
    
    this.SetupGraphics();
    this.SetupIFCLoader();
    this.animFrameId = window.requestAnimationFrame(this.Animate); 
    InputHandler.ClearEventListners();
    this.SetupEntities();
  }

  SetupEntities(){
    this.entityManager = new EntityManager();

    const playerEntity = new Entity("Player");
    playerEntity.AddComponent(new PlayerControls(this.camera)); 
    this.entityManager.Add(playerEntity); 

    this.entityManager.Initialize();
  }

  SetupGraphics(){

    this.scene = new Scene();
    this.threeCanvas = document.getElementById("three-canvas");

    this.renderer = new WebGLRenderer({
      canvas:  this.threeCanvas, 
      alpha: true 
    });
    
    const size = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    
    this.renderer.setSize(size.width, size.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
    this.camera = new PerspectiveCamera(75, size.width / size.height);
    this.camera.near = 0.01; 
    this.camera.position.z = 2.5;
    this.camera.position.y = 1.7;
    this.camera.position.x = 0;
    this.camera.lookAt(new Vector3(0,0,0));

    this.scene.add(this.camera);

    this.SetupLight();
    this.SetupGridsAndAxis(); 
    this.WindowResizeHanlder();

    window.addEventListener('resize', this.WindowResizeHanlder);
  }

  SetupLight(){
    
    const lightColor = 0xffffff;
    const ambientLight = new AmbientLight(lightColor, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(lightColor, 1);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

  }

  SetupIFCLoader(){
    //Sets up the IFC loading
      this.ifcLoader = new IFCLoader();
      this.ifcLoader.ifcManager.setWasmPath("static/");
      // this.ifcLoader.ifcManager.applyWebIfcConfig({ USE_FAST_BOOLS: true });
      const input = document.getElementById("file-input");
      input.addEventListener(
        "change",
        (changed) => {
          console.log("file added");
          const ifcURL = URL.createObjectURL(changed.target.files[0]);
          this.ifcLoader.load(ifcURL, (ifcModel) => this.scene.add(ifcModel));
        },
        false
      ); 
  }

  SetupGridsAndAxis(){
    const grid = new GridHelper(1000, 300);
    this.scene.add(grid);
    const axes = new AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    this.scene.add(axes);
  }

  Animate = (t) => {
    if(this.lastFrameTime===null){
      this.lastFrameTime = t;
    }
    const delta = t-this.lastFrameTime;
    let elapsedTime = Math.min(1.0 / 30.0, delta * 0.001);

    this.entityManager.Update(elapsedTime);

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = window.requestAnimationFrame(this.Animate); 
  }

  WindowResizeHanlder = ()  => {
    const { innerHeight, innerWidth } = window;
      this.renderer.setSize(innerWidth, innerHeight);
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
  }
      
}


let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
  _APP = new App();
});
  