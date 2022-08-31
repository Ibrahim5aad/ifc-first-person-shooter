import {
    AnimationMixer,
    Euler,
    MathUtils
  } from "three";
  
import Component from '../component'
import InputHandler from '../../helpers/input-handler'
import WeaponFSM from './weapon-fsm';


export default class Weapon extends Component{
    constructor(camera, animations, model){
        super();
        this.name = 'Weapon';
        this.camera = camera;
        this.model = model; 
        this.modelAnimations = animations;
        this.animations = {};
        this.shoot = false;
        this.reloading = false;
        this.shootTimer = 0.0;

    }
    
    Initialize(){
        const scene = this.model;
        scene.scale.set(0.05, 0.05, 0.05);
        scene.position.set(0.04, -0.02, 0.0);
        scene.setRotationFromEuler(new Euler(MathUtils.degToRad(5), MathUtils.degToRad(185), 0));

        scene.traverse(child=>{
            if(!child.isSkinnedMesh){
                return;
            }

            child.receiveShadow = true;
        });

        this.camera.add(scene);

        this.SetAnimations();
  
        this.stateMachine = new WeaponFSM(this);
        this.stateMachine.SetState('idle');
  
        this.SetupInput(); 
    }

    SetAnim(name, clip){
        const action = this.mixer.clipAction(clip);
        this.animations[name] = {clip, action};
    }

    SetAnimations(){
        this.mixer = new AnimationMixer( this.model );

        this.SetAnim('idle', this.modelAnimations[1]);
        this.SetAnim('reload', this.modelAnimations[2]);
        this.SetAnim('shoot', this.modelAnimations[0]);
    }

    SetupInput(){
        InputHandler.AddMouseDownListner( e => {
            if(e.button != 0 || this.reloading){
                return;
            }

            var controls = this.GetComponent("PlayerControls");

            if(!controls.isLocked)
            {
                return;
            }

            this.shoot = true;
            this.shootTimer = 0.0;
        });

        InputHandler.AddMouseUpListner( e => {
            if(e.button != 0){
                return;
            }

            this.shoot = false;
        });

        InputHandler.AddKeyDownListner(e => {
            if(e.repeat) return;

            if(e.code == "KeyR"){
                this.Reload();
            }
        });
    }

    Reload(){
        if(this.reloading){
            return;
        }
        console.log("Reloading");
        this.reloading = true;
        this.stateMachine.SetState('reload');
        this.Broadcast({topic: 'weapon_reload_sound'});
        console.log('weapon_reload_sound');
    }
    


    ReloadDone(){
        this.reloading = false;
    }


    Shoot(t){
        if(!this.shoot){
            
            this.Broadcast({topic: 'weapon_shot_sound_off'});
            return;
        }
 
        if(this.shootTimer <= 0.0 ){
             
            this.Broadcast({topic: 'weapon_shot'});
        }

        this.Broadcast({topic: 'weapon_shot_sound'});
        this.shootTimer = Math.max(0.0, this.shootTimer - t);
    }

    
    Update(t){
        this.mixer.update(t);
        this.stateMachine.Update(t);
        this.Shoot(t);
    }
}