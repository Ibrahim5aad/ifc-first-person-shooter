import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AudioListener,
  AudioLoader,
  Vector3
} from "three";
 
import {AmmoHelper, MyAmmo as Ammo, createConvexHullShape} from './helpers/ammo-helper'


import {  GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { IFCLoader } from "web-ifc-three/IFCLoader";
import InputHandler from './helpers/input-handler'
import PlayerControls from './entities/player/player-controls'
import PlayerPhysics from './entities/player/player-physics'
import LevelSetup from './entities/level/level'

import EntityManager from './entities/entity-manager'
import Entity from './entities/entity'

import IFCModel from './entities/ifc-model/ifc-model';

import Weapon from './entities/player/weapon';
import PlayerSound from './entities/player/player-sound';

import weapon from './assets/animations/ak47/ak47.glb'

//sounds
import weaponShot from './assets/sounds/weapon_shot2.mp3'
import playerWalk from './assets/sounds/player-walk.wav'
import playerJump from './assets/sounds/player-jump.mp3'
import weaponReload from './assets/sounds/weapon_reload.mp3'
 
import level from './assets/level.glb'

class App{
 
  constructor(){

    this.lastFrameTime = null;
    this.assets = {};
    this.animFrameId = 0;

    AmmoHelper.Init(()=>{this.Init();});
  }

  Init(){
    this.LoadAssets();
    setTimeout(() => {
      this.SetupGraphics();
      this.SetupIFCLoader();
    }, 4000);

    setTimeout(() => {
      this.animFrameId = window.requestAnimationFrame(this.Animate); 
      InputHandler.ClearEventListners();
      this.SetupPhysics();
      this.SetupEntities();
    }, 5000);
  }

  SetupEntities(){
    this.entityManager = new EntityManager();
    const playerEntity = new Entity("Player");
    playerEntity.AddComponent(new PlayerPhysics(this.physicsWorld));
    playerEntity.AddComponent(new PlayerControls(this.camera));
    playerEntity.AddComponent(new Weapon(this.camera, this.assets['weapon'].animations, this.assets['weapon'].scene));
    playerEntity.AddComponent(new PlayerSound(this.listener, this.assets));
    playerEntity.SetPosition(new Vector3(-15.14, 2.48, -1.36));
  
    const ifcModelEntity = new Entity("IFCModel");
    ifcModelEntity.AddComponent(new IFCModel(this.ifcModel, this.scene, this.physicsWorld));

    const levelEntity = new Entity();
    levelEntity.SetName('Level');
    levelEntity.AddComponent(new LevelSetup(this.scene, this.physicsWorld));

    this.entityManager.Add(playerEntity); 
    this.entityManager.Add(levelEntity); 
    this.entityManager.Add(ifcModelEntity); 
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

    this.listener = new AudioListener();
    this.camera.add( this.listener );

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
      
      this.ifcLoader.load("/assets/ifc-models/RME_basic_sample_project.ifc", (ifcModel) =>
          {
            this.ifcModel = ifcModel;
          });
 
      // const input = document.getElementById("file-input");
      // input.addEventListener(
        // "change",
        // (changed) => {
        //   const ifcURL = URL.createObjectURL(changed.target.files[0]);
        //   this.ifcLoader.load(ifcURL, (ifcModel) =>
        //   {
            
        //   }
        //   );
        // },
        // false
      //); 
  }

  SetupPhysics() {
    
    //Setting up the physical world
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
         dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration ),
         overlappingPairCache = new Ammo.btDbvtBroadphase(),
         solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
    this.physicsWorld.setGravity( new Ammo.btVector3( 0.0, -4.81, 0.0 ) );

    const fp = Ammo.addFunction(this.PhysicsUpdate);
    this.physicsWorld.setInternalTickCallback(fp);
    this.physicsWorld.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
 
  }

  PhysicsUpdate = (world, timeStep)=>{
    this.entityManager.PhysicsUpdate(world, timeStep);
  }

  SetupGridsAndAxis(){
    const grid = new GridHelper(1000, 300);
    this.scene.add(grid);
    // const axes = new AxesHelper();
    // axes.material.depthTest = false;
    // axes.renderOrder = 1;
    // this.scene.add(axes);
  }

  Animate = (t) => {
    if(this.lastFrameTime===null){
      this.lastFrameTime = t;
    }
    const delta = t-this.lastFrameTime;
    let elapsedTime = Math.min(1.0 / 30.0, delta * 0.001);

    this.physicsWorld.stepSimulation( elapsedTime, 10 );

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
   
  async LoadAssets(){

    const gltfLoader = new GLTFLoader();
    const audioLoader = new AudioLoader();

    // await this.AddAsset(level, gltfLoader, "level");
    await this.AddAsset(weapon, gltfLoader, "weapon");
    await this.AddAsset(weaponShot, audioLoader, "weaponShot");
    await this.AddAsset(playerWalk, audioLoader, "playerWalk");
    await this.AddAsset(playerJump, audioLoader, "playerJump");
    await this.AddAsset(weaponReload, audioLoader, "weaponReload");


  }

  async AddAsset(asset, loader, name){
     await loader.loadAsync(asset).then( r =>{
      this.assets[name] = r;
    });
    
  }
}


let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
  _APP = new App();
});
  