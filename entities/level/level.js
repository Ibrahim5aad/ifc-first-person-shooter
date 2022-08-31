import Component from '../component'
import * as THREE from 'three'
import {MyAmmo as Ammo, createConvexHullShape} from '../../helpers/ammo-helper'

export default class LevelSetup extends Component{
    constructor(scene, physicsWorld){
        super();
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.name = 'LevelSetup';
        const geometry = new THREE.BoxGeometry(1000, 1, 1000); 
        geometry.translate(0, -1 , 0);

        var textureLoader = new THREE.TextureLoader();
        var texture = textureLoader.load("../../assets/textures/ground.jpg");


        const material = new THREE.MeshStandardMaterial( { map: texture} );
        this.mesh = new THREE.Mesh(geometry); 
    }

    LoadScene(){
        
        this.mesh.traverse( ( node ) => {
            if ( node.isMesh || node.isLight ) { node.castShadow = true; }
            if(node.isMesh){ 
                node.receiveShadow = true; 
                //node.material.wireframe = true;
                this.SetStaticCollider(node);
            }

            if(node.isLight){
                node.intensity = 3;
                const shadow = node.shadow;
                const lightCam = shadow.camera;

                shadow.mapSize.width = 1024 * 3;
                shadow.mapSize.height = 1024 * 3;
                shadow.bias = -0.00007;

                const dH = 35, dV = 35;
                lightCam.left = -dH;
                lightCam.right = dH;
                lightCam.top = dV;
                lightCam.bottom = -dV; 
            }
        });

        this.scene.add( this.mesh );
    }


    SetStaticCollider(mesh){
        const shape = createConvexHullShape(mesh);
        const mass = 0;
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0,0,0);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const object = new Ammo.btRigidBody(rbInfo);
        object.parentEntity = this.parent;
        object.mesh = mesh;
  
        this.physicsWorld.addRigidBody(object);
    }

    Initialize(){
        this.LoadScene();
    }
}