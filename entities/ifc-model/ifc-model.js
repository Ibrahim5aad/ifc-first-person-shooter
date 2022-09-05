 
import Component from '../component'
import {MyAmmo as Ammo, createConvexHullShape, createConvexHullShape2} from '../../helpers/ammo-helper'
import { IfcAPI } from "web-ifc/web-ifc-api"; 
import {
    BufferGeometry,
    BufferAttribute,
    MeshBasicMaterial,
    Mesh,
    Matrix4,
    Color,
    DoubleSide,
    MeshPhongMaterial
  } from "three";
    

export default class IFCModel extends Component{
    constructor(mesh, scene, physicsWorld){
        super();
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.name = 'IFCModel';
        this.mesh = mesh;
        this.elements = {};
        this.ifcapi = new IfcAPI();
        this.ifcapi.SetWasmPath("../../static/");
        this.materials = {};

        fetch('../../assets/ifc-models/basic_project.ifc')
            .then(response => response.text())
            .then(async data => {
               const uint8array = new TextEncoder().encode(data);
               this.modelID = await this.OpenIfc(uint8array);
               var geometries = this.ifcapi.LoadAllGeometry(this.modelID);
               var size = geometries.size();
               for (let i = 0; i < size; i++) {
                var mesh = geometries.get(i);
                var placedGeometries  = mesh.geometries;
                for (let i = 0; i < placedGeometries.size(); i++)
                {
                    const placedGeometry = placedGeometries.get(i);
                    const geometryMesh = this.getPlacedGeometry(this.modelID, placedGeometry); 
                    
                    try{
                        this.SetStaticCollider(geometryMesh);
                        this.scene.add(geometryMesh);
                    }
                    catch(e){

                    }
                }

              }

            });
 
    }
 

    async OpenIfc(ifcAsText) {
        await this.ifcapi.Init();
        return this.ifcapi.OpenModel(ifcAsText);
    }

    LoadScene(){
        
        // this.mesh.traverse( ( node ) => {
        //     if ( node.isMesh || node.isLight ) { node.castShadow = true; }
        //     if(node.isMesh){
        //         this.SetStaticCollider(node);
        //     } 
        // });
        // console.log(this.mesh);
        //this.scene.add(this.mesh);
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

    SetStaticCollider2(mesh){
        const shape = createConvexHullShape2(mesh);
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
 

    getPlacedGeometry(modelID, placedGeometry) {
        const geometry = this.getBufferGeometry(modelID, placedGeometry);
        const material = this.getMeshMaterial(placedGeometry.color);
        const mesh = new Mesh(geometry, material);
        mesh.matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
        mesh.matrixAutoUpdate = false;
        return mesh;
    }
    

    getBufferGeometry(modelID, placedGeometry) {
        
        const geometry = this.ifcapi.GetGeometry(modelID, placedGeometry.geometryExpressID);
        const verts = this.ifcapi.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
        const indices = this.ifcapi.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
        const bufferGeometry = this.ifcGeometryToBuffer(placedGeometry.color, verts, indices);
 
        geometry.delete();
        return bufferGeometry;
    }
 

    getMeshMaterial(color) {
        let colID = `${color.x}${color.y}${color.z}${color.w}`;
        if (this.materials[colID])
        {
            return this.materials[colID];
        }

        const col = new Color(color.x, color.y, color.z);
        const material = new MeshPhongMaterial({ color: col, side: DoubleSide });
        material.transparent = color.w !== 1;
        if (material.transparent) material.opacity = color.w;

        this.materials[colID] = material;

        return material;
    }


    getMeshMatrix(matrix) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }
    

    ifcGeometryToBuffer(color, vertexData, indexData) {
        const geometry = new BufferGeometry(); 
        let posFloats = new Float32Array(vertexData.length / 2);
        let normFloats = new Float32Array(vertexData.length / 2);
        let colorFloats = new Float32Array(vertexData.length / 2);

        for (let i = 0; i < vertexData.length; i += 6)
        {
            posFloats[i / 2 + 0] = vertexData[i + 0];
            posFloats[i / 2 + 1] = vertexData[i + 1];
            posFloats[i / 2 + 2] = vertexData[i + 2];

            normFloats[i / 2 + 0] = vertexData[i + 3];
            normFloats[i / 2 + 1] = vertexData[i + 4];
            normFloats[i / 2 + 2] = vertexData[i + 5];
            
            colorFloats[i / 2 + 0] = color.x;
            colorFloats[i / 2 + 1] = color.y;
            colorFloats[i / 2 + 2] = color.z;
        }
       
        geometry.setAttribute(
            'position',
            new BufferAttribute(posFloats, 3));
        geometry.setAttribute(
            'normal',
            new BufferAttribute(normFloats, 3));
        geometry.setAttribute(
            'color',
            new BufferAttribute(colorFloats, 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }


    Initialize(){
        this.LoadScene();
    }
}