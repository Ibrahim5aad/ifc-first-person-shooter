
import Component from '../component'
import {
    Audio
  } from "three";
  


export default class PlayerSound extends Component{
    constructor(audioListener, assets){
            super();
            this.audioListener = audioListener;
            this.shotSoundBuffer = assets['weaponShot'];
            this.playerWalkBuffer = assets['playerWalk'];
            this.playerJumpBuffer = assets['playerJump'];
            this.weaponReloadBuffer = assets['weaponReload'];
    }


    Initialize(){
        this.SetSoundEffect();
        this.parent.RegisterEventHandler(this.OnWeaponShot.bind(this), 'weapon_shot_sound');
        this.parent.RegisterEventHandler(this.OnWeaponShotOff.bind(this), 'weapon_shot_sound_off');

        this.parent.RegisterEventHandler(this.OnPlayerWalk.bind(this), 'walk_sound');
        this.parent.RegisterEventHandler(this.OnPlayerWalkStop.bind(this), 'stop_walk_sound');
        this.parent.RegisterEventHandler(this.OnPlayerJump.bind(this), 'player_jump_sound');
        this.parent.RegisterEventHandler(this.OnWeaponReload.bind(this), 'weapon_reload_sound');


    }

    SetSoundEffect(){
        this.shotSound = new Audio(this.audioListener);
        this.shotSound.setBuffer(this.shotSoundBuffer);
        this.shotSound.setLoop(true);
        
        this.walkSound = new Audio(this.audioListener);
        this.walkSound.setBuffer(this.playerWalkBuffer);
        this.walkSound.setLoop(true);

        this.jumpSound = new Audio(this.audioListener);
        this.jumpSound.setBuffer(this.playerJumpBuffer);
        this.jumpSound.setLoop(false);

        this.reloadSound = new Audio(this.audioListener);
        this.reloadSound.setBuffer(this.weaponReloadBuffer);
        this.reloadSound.setLoop(false);
    }


    OnWeaponShot(){
        if(!this.shotSound.isPlaying){
            this.shotSound.play();
        }
    }

    OnWeaponShotOff(){
        if(this.shotSound.isPlaying){
            this.shotSound.stop();
        }
    }

    OnPlayerWalk(){
        if(!this.walkSound.isPlaying){
            this.walkSound.play(); 
        }
    }


    OnPlayerJump(){
        if(!this.jumpSound.isPlaying){
            this.jumpSound.play();
        }
    }

    OnPlayerWalkStop(){
        if(this.walkSound.isPlaying){
            this.walkSound.stop(); 
        }
    }

    OnWeaponReload(){
        if(!this.reloadSound.isPlaying){
            this.reloadSound.play(); 
        }
    }
}