import {
    Euler,
    Quaternion,
    Vector3
  } from "three";
  
import Component from '../component'
import InputHandler from '../../helpers/input-handler'
import {MyAmmo as Ammo} from '../../helpers/ammo-helper'


export default class PlayerControls  extends Component{
    constructor(camera){
        super();
        
        this.name = 'PlayerControls';
        this.camera = camera;

        this.timeZeroToMax = 0.08;

        this.maxSpeed = 5.0;
        this.speed = new Vector3();
        this.acceleration = this.maxSpeed / this.timeZeroToMax;
        this.decceleration = -3.0;

        this.mouseSpeed = 0.002; 
        
        this.isLocked = false; 

        this.angles = new Euler();
        this.pitch = new Quaternion();
        this.yaw = new Quaternion();

        this.jumpVelocity = 10;
        this.yOffset = 0.5;
        this.tempVec = new Vector3();
        this.moveDir = new Vector3();
        this.xAxis = new Vector3(1.0, 0.0, 0.0);
        this.yAxis = new Vector3(0.0, 1.0, 0.0);
    }

    Initialize(){
        this.physicsComponent = this.GetComponent("PlayerPhysics");
        this.physicsBody = this.physicsComponent.body;
        this.transform = new Ammo.btTransform();
        this.zeroVec = new Ammo.btVector3(0.0, 0.0, 0.0);

        this.angles.setFromQuaternion(this.parent.Rotation);
        this.UpdateRotation(); 

        InputHandler.AddMouseMoveListner(this.OnMouseMove);
        InputHandler.AddKeyDownListner(this.OnKeyDown);
        InputHandler.AddKeyUpListner(this.OnKeyUp);

        document.addEventListener('pointerlockchange', this.OnPointerlockChange) 
        InputHandler.AddClickListner( () => {
            if(!this.isLocked){
                document.body.requestPointerLock();
            }
        });
    }

    OnPointerlockChange = () => {
        if (document.pointerLockElement) {
            this.isLocked = true;
            return;
        }

        this.isLocked = false;
    }

    OnKeyDown = (e) => {

        if(InputHandler.GetKeyDown("KeyS") || 
        InputHandler.GetKeyDown("KeyW") ||
        InputHandler.GetKeyDown("KeyD") || 
        InputHandler.GetKeyDown("KeyA"))
        {
            this.Broadcast({topic: 'walk_sound'});
        }

    }


    OnKeyUp = (e) => {
        if(!(InputHandler.GetKeyDown("KeyS") || 
        InputHandler.GetKeyDown("KeyW") ||
        InputHandler.GetKeyDown("KeyD") || 
        InputHandler.GetKeyDown("KeyA")))
        {
            this.Broadcast({topic: 'stop_walk_sound'});
        }


    }

    OnMouseMove = (event) => {
        if (!this.isLocked) {
          return;
        }
    
        const { movementX, movementY } = event;
        this.angles.y -= movementX * this.mouseSpeed;
        this.angles.x -= movementY * this.mouseSpeed;
        this.angles.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.angles.x));

        this.UpdateRotation();
    }

    UpdateRotation(){

        this.pitch.setFromAxisAngle(this.xAxis, this.angles.x);
        this.yaw.setFromAxisAngle(this.yAxis, this.angles.y);
        this.parent.Rotation.multiplyQuaternions(this.yaw, this.pitch).normalize();
        this.camera.quaternion.copy(this.parent.Rotation); 
 
    }

    Accelarate = (t) => {
        const accel = this.tempVec.copy(this.moveDir).multiplyScalar(this.acceleration * t);
        this.speed.add(accel);
        this.speed.clampLength(0.0, this.maxSpeed);
    }

    Deccelerate = (t) => {
        const frameDeccel = this.tempVec.copy(this.speed).multiplyScalar(this.decceleration * t);
        this.speed.add(frameDeccel);
    }

    Update(t){
        
        // Those factors determine the movement direction aligned with the x-z axes
        const forwardFactor = InputHandler.GetKeyDown("KeyS") - InputHandler.GetKeyDown("KeyW");
        const rightFactor = InputHandler.GetKeyDown("KeyD") - InputHandler.GetKeyDown("KeyA");
        
        // Constructing a x-z aligned movement vector
        this.moveDir = this.moveDir.set(rightFactor, 
                                        0.0, 
                                        forwardFactor).normalize();
       

        const velocity = this.physicsBody.getLinearVelocity();
        if(InputHandler.GetKeyDown('Space') && this.physicsComponent.canJump){
            velocity.setY(this.jumpVelocity);
            this.physicsComponent.canJump = false;
            this.Broadcast({topic: 'player_jump_sound'});
        }


        // Simulate movement acceleration and decceleration
        this.Deccelerate(t);
        this.Accelarate(t);
        
        // Add the accelrated/deccelerated speed to the movement vector
        const moveVector = this.tempVec.copy(this.speed);

        // // Apply the yaw rotation to the movement direction vector
        moveVector.applyQuaternion(this.yaw); 

        velocity.setX(moveVector.x);
        velocity.setZ(moveVector.z);

        this.physicsBody.setLinearVelocity(velocity);
        this.physicsBody.setAngularVelocity(this.zeroVec);

        const ms = this.physicsBody.getMotionState();

        if(ms){
            ms.getWorldTransform(this.transform);
            const p = this.transform.getOrigin();
            this.camera.position.set(p.x(), p.y() + this.yOffset, p.z());
            this.parent.SetPosition(this.camera.position);
        }
 
        // // Set new camera postion and propagate the new postiton to componenet parent
        // var tmp = this.camera.position.add(moveVector); 
        // this.camera.position.set(tmp.x, tmp.y, tmp.z);
        // this.parent.SetPosition(this.camera.position);

    }
}